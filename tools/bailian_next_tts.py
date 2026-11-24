#!/usr/bin/env python3
"""Generate a WAV from a text storyboard with Qwen-Audio Next."""

import argparse
from datetime import datetime, timezone
import getpass
from http.client import HTTPException
import json
import os
from pathlib import Path
import re
import shutil
import socket
import ssl
import struct
import subprocess
import sys
import tempfile
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import uuid4
import warnings
import wave


MODEL = "qwen-audio-3.1-tts-next"
REGION = "cn-beijing"
SYNTHESIS_PATH = "/api/v1/services/audio/tts/SpeechSynthesizer"
SAMPLE_RATE = 48000
CHANNELS = 2
SAMPLE_PROMPT = (
    "生成一段约十二秒的普通话悬疑短片声景。先是细雨和公交车由远到近的声音。"
    "女旁白像跟朋友讲亲身经历，自然地说：‘凌晨零点四十七。那辆早就停运的末班车，又开来了。’"
    "随后是短促的气刹和车门打开声。男司机低声说：‘还差一位。’"
    "不加配乐，不念场景描述，不加台词，雨声不要盖过人声。"
)


class TTSError(Exception):
    """An error safe to display without request credentials or download URLs."""


class BadWav(Exception):
    """The file is not a complete standard PCM WAV."""


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def is_http_url(url):
    try:
        parsed = urlsplit(url)
        return parsed.scheme in {"http", "https"} and parsed.hostname and parsed.username is None
    except ValueError:
        return False


class DownloadRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not is_http_url(newurl):
            raise TTSError("音频下载被重定向到了无效地址。")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def read_key(prompt_key):
    key = os.environ.get("DASHSCOPE_API_KEY", "").strip()
    if not key and prompt_key:
        with warnings.catch_warnings():
            warnings.simplefilter("error", getpass.GetPassWarning)
            try:
                key = getpass.getpass("百炼 API Key（隐藏输入）> ").strip()
            except (getpass.GetPassWarning, EOFError):
                raise TTSError("当前终端无法隐藏输入，请在交互式终端运行 --prompt-key。") from None
    if not key:
        raise TTSError("缺少 DASHSCOPE_API_KEY。可以在交互式终端用 --prompt-key 隐藏输入。")
    if any(not 33 <= ord(char) <= 126 for char in key):
        raise TTSError("API Key 格式无效。请输入完整 Key，且不含空格或换行。")
    return key


def make_endpoint(region, workspace=None):
    label = r"[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    if not re.fullmatch(label, region) or (workspace is not None and not re.fullmatch(label, workspace)):
        raise TTSError("地域或业务空间 ID 格式无效。")
    if workspace is not None:
        host = f"{workspace}.{region}.maas.aliyuncs.com"
    else:
        host = f"{region}.maas.qianwenaiapi.com"
    return f"https://{host}{SYNTHESIS_PATH}"


def provider_error(status, result, fallback="响应缺少有效的 output.audio.url。"):
    if not isinstance(result, dict):
        result = {}
    nested = result.get("error")
    if not isinstance(nested, dict):
        nested = {}
    code = str(result.get("code") or nested.get("code") or "").casefold()
    detail = str(result.get("message") or nested.get("message") or "").casefold()
    if code in {"invalidworkspace", "invalidregion", "workspacenotfound"} or any(
        phrase in detail for phrase in (
            "workspace not found", "workspace does not exist", "workspace mismatch",
            "does not belong to this workspace", "region mismatch",
        )
    ):
        reason = "工作空间或地域与当前 Key 不匹配，或该空间不存在。"
    elif status == 401 or code == "invalidapikey":
        reason = "认证失败，百炼未接受此 API Key。"
    elif status == 403 or code == "accessdenied":
        reason = "访问被拒绝，请检查当前 Key 在该空间的模型调用权限。"
    elif "model not exist" in detail or status == 404:
        reason = "当前配置下找不到模型或接口，请核对该空间的模型可用性。"
    elif status == 429 or code == "throttling.ratequota":
        reason = "请求触发限流或额度限制。"
    elif code == "datainspectionfailed":
        reason = "百炼内容检查未通过。"
    elif status in (400, 422) or code == "client_error":
        reason = "百炼拒绝了合成参数，请检查提示词和接口配置。"
    elif status is not None and 300 <= status < 400:
        reason = "鉴权接口返回重定向，已停止请求。"
    elif status is not None and status >= 500:
        reason = "百炼服务端返回错误。"
    else:
        reason = fallback
    suffix = f"（HTTP {status}）" if status is not None else ""
    request_id = result.get("request_id")
    if isinstance(request_id, str) and re.fullmatch(r"[0-9A-Fa-f][0-9A-Fa-f-]{15,47}", request_id):
        reason += f" 请求 ID {request_id}。"
    return TTSError(f"百炼合成失败{suffix}。{reason}")


def read_error_body(response):
    try:
        with response:
            return json.loads(response.read(64 * 1024))
    except (OSError, HTTPException, ValueError):
        return {}


def network_error(stage, error, timeout):
    reason = error.reason if isinstance(error, URLError) else error
    if isinstance(reason, (TimeoutError, socket.timeout)):
        detail = f"连接或读取超时（{timeout} 秒）。"
    elif isinstance(reason, socket.gaierror):
        detail = "无法解析服务域名。"
    elif isinstance(reason, ssl.SSLError):
        detail = "无法建立可信的 HTTPS 连接。"
    else:
        detail = "连接中断或读取失败，请检查本机联网状态。"
    return TTSError(f"{stage}失败。{detail}")


def synthesize(endpoint, key, prompt):
    body = {
        "model": MODEL,
        "input": {
            "text_prompt": prompt, "format": "wav",
            "sample_rate": SAMPLE_RATE, "channels": CHANNELS,
        },
    }
    request = Request(
        endpoint, method="POST",
        data=json.dumps(body, ensure_ascii=False).encode("utf-8"),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    try:
        with build_opener(NoRedirect()).open(request, timeout=300) as response:
            status = response.status
            result = json.load(response)
    except HTTPError as error:
        raise provider_error(error.code, read_error_body(error)) from None
    except (OSError, HTTPException) as error:
        raise network_error("百炼合成请求", error, 300) from None
    except ValueError:
        raise TTSError("百炼合成响应不是有效的 JSON。") from None

    if not isinstance(result, dict):
        raise provider_error(status, result, "返回的 JSON 顶层不是对象。")
    output = result.get("output")
    if not isinstance(output, dict):
        raise provider_error(status, result, "返回的 JSON 缺少有效的 output 对象。")
    audio = output.get("audio")
    if not isinstance(audio, dict):
        raise provider_error(status, result, "返回的 JSON 缺少有效的 output.audio 对象。")
    url = audio.get("url")
    if not url:
        raise provider_error(status, result, "output.audio.url 缺失或为空。")
    if not isinstance(url, str):
        raise provider_error(status, result, "output.audio.url 的值不是字符串。")
    url = url.strip()
    if url.startswith("//"):
        url = "https:" + url
    if not is_http_url(url):
        raise provider_error(status, result, "output.audio.url 不是可下载的 HTTP(S) 地址。")
    return url


def download(url, destination):
    request = Request(url, method="GET", headers={"Accept-Encoding": "identity"})
    try:
        with build_opener(DownloadRedirect()).open(request, timeout=60) as response:
            expected = response.headers.get("Content-Length", "")
            with destination.open("wb") as audio:
                shutil.copyfileobj(response, audio, length=1024 * 1024)
        received = destination.stat().st_size
    except HTTPError as error:
        error.close()
        raise TTSError(f"合成已返回音频地址，但取回音频失败（HTTP {error.code}）。") from None
    except (OSError, HTTPException) as error:
        raise network_error("音频下载", error, 60) from None
    except ValueError:
        raise TTSError("合成响应中的音频下载地址无效。") from None
    if received == 0 or (expected.isdecimal() and received != int(expected)):
        raise TTSError("下载的音频为空或传输未完成。")


def pcm_info(path):
    try:
        with wave.open(str(path), "rb") as audio:
            frames = audio.getnframes()
            rate = audio.getframerate()
            channels = audio.getnchannels()
            width = audio.getsampwidth()
            if frames <= 0 or rate <= 0 or audio.getcomptype() != "NONE":
                raise BadWav()
            for first in range(0, frames, 65536):
                count = min(65536, frames - first)
                if len(audio.readframes(count)) != count * channels * width:
                    raise BadWav()
            if audio.readframes(1):
                raise BadWav()
    except (wave.Error, EOFError, struct.error):
        raise BadWav() from None
    return frames, rate, channels


def locate_ffmpeg(option):
    if option:
        path = shutil.which(option)
        if not path:
            raise TTSError("指定的 FFmpeg 无法运行，请检查 --ffmpeg 路径。")
        return path
    on_path = shutil.which("ffmpeg")
    if on_path:
        return on_path
    bundled = Path("D:/AI/Replay/resources/bin/ffmpeg.exe")
    return str(bundled) if os.name == "nt" and bundled.is_file() else None


def repair_wav_length(path):
    """Repair placeholder RIFF/data sizes for a complete frame-aligned payload."""
    size = path.stat().st_size
    with path.open("rb") as audio:
        header = audio.read(12)
        if (len(header) != 12 or header[:4] != b"RIFF" or header[8:] != b"WAVE"
                or size - 8 > 0xFFFFFFFF):
            return path
        alignment = 0
        while audio.tell() + 8 <= size:
            tag, length = struct.unpack("<4sI", audio.read(8))
            first = audio.tell()
            remaining = size - first
            if tag == b"fmt " and 16 <= length <= remaining:
                kind, _, _, _, block_align, _ = struct.unpack("<HHIIHH", audio.read(16))
                if kind in (1, 3, 0xFFFE):
                    alignment = block_align
            if tag == b"data":
                if alignment and remaining and remaining % alignment == 0 and (length == 0 or length > remaining):
                    repaired = path.with_name("header-repaired.wav")
                    shutil.copyfile(path, repaired)
                    with repaired.open("r+b") as output:
                        output.seek(4)
                        output.write(struct.pack("<I", size - 8))
                        output.seek(first - 4)
                        output.write(struct.pack("<I", remaining))
                    return repaired
                break
            audio.seek(first + length + (length & 1))
    return path


def run_ffmpeg(program, path, output=None):
    command = [program, "-nostdin", "-hide_banner", "-v", "error", "-xerror", "-i", str(path), "-map", "0:a:0"]
    command += ["-c:a", "pcm_s16le", str(output)] if output else ["-f", "null", "-"]
    try:
        subprocess.run(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
    except (OSError, subprocess.CalledProcessError):
        operation = "转换为标准 PCM WAV" if output else "完整解码"
        raise TTSError(f"音频校验失败。FFmpeg 无法{operation}。") from None


def verify_wav(path, ffmpeg):
    normalized = False
    try:
        frames, rate, channels = pcm_info(path)
    except BadWav:
        if not ffmpeg:
            raise TTSError("下载的音频需要标准 PCM 转换，请用 --ffmpeg 指向可用程序。") from None
        output = path.with_name("standard.wav")
        run_ffmpeg(ffmpeg, repair_wav_length(path), output)
        path = output
        normalized = True
        try:
            frames, rate, channels = pcm_info(path)
        except BadWav:
            raise TTSError("转换后的 WAV 仍无法完整读取。") from None

    if (rate, channels) != (SAMPLE_RATE, CHANNELS):
        raise TTSError(f"音频校验失败。实际是 {rate} Hz、{channels} 声道，要求 48000 Hz、双声道。")
    if ffmpeg:
        run_ffmpeg(ffmpeg, path)
    return path, frames / rate, normalized


def save_wav(source, folder):
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    target = folder / f"bailian-next-{stamp}-{uuid4().hex[:6]}.wav"
    with source.open("rb") as audio, target.open("xb") as output:
        try:
            shutil.copyfileobj(audio, output, length=1024 * 1024)
            output.flush()
        except BaseException:
            output.close()
            target.unlink(missing_ok=True)
            raise
    return target


def main():
    parser = argparse.ArgumentParser(description="将文字分镜交给 Qwen-Audio Next，生成 48 kHz 双声道 WAV。")
    parser.add_argument("--prompt-file", type=Path, help="UTF-8 文字分镜文件，默认使用内置的末班车试音分镜。")
    parser.add_argument("--prompt-key", action="store_true", help="环境变量缺失时在终端隐藏输入 Key。")
    parser.add_argument("--output-dir", type=Path, default=Path("outputs"), help="WAV 保存目录，默认 outputs/。")
    parser.add_argument("--ffmpeg", help="本机 FFmpeg 路径，需要时用于解码及 PCM 转换。")
    parser.add_argument("--region", default=REGION, help="服务地域，默认 cn-beijing。")
    parser.add_argument("--workspace-id", help="指定阿里云百炼业务空间 ID 时，改用该空间的专属入口。")
    args = parser.parse_args()

    try:
        prompt = args.prompt_file.read_text(encoding="utf-8-sig").strip() if args.prompt_file else SAMPLE_PROMPT
    except (OSError, UnicodeError):
        raise TTSError("无法读取提示词文件，请确认路径和 UTF-8 编码。") from None
    if not 0 < len(prompt) <= 3000:
        raise TTSError("提示词长度须在 1 到 3000 个字符之间。")

    endpoint = make_endpoint(args.region, args.workspace_id)
    ffmpeg = locate_ffmpeg(args.ffmpeg)
    folder = args.output_dir.resolve()
    folder.mkdir(parents=True, exist_ok=True)
    key = read_key(args.prompt_key)
    print(f"正在请求 {urlsplit(endpoint).hostname} 上的 {MODEL} 合成音频。", flush=True)
    url = synthesize(endpoint, key, prompt)
    del key
    print("生成请求成功，正在下载和验证音频。", flush=True)
    with tempfile.TemporaryDirectory(prefix="bailian-next-") as temporary:
        raw = Path(temporary) / "download.wav"
        download(url, raw)
        try:
            audio, seconds, normalized = verify_wav(raw, ffmpeg)
        except TTSError as error:
            recovery = Path(tempfile.mkdtemp(prefix="bailian-wav-recovery-")) / "download.wav"
            raw.replace(recovery)
            raise TTSError(f"{error} 下载原件已保留在 {recovery}。") from None
        saved = save_wav(audio, folder)
    if normalized:
        print("已在本地转换成标准 PCM WAV。")
    print(f"已保存 {saved}")
    print(f"时长 {seconds:.3f} 秒，48 kHz，双声道，完整解码通过。")


if __name__ == "__main__":
    try:
        main()
    except TTSError as error:
        sys.exit(str(error))
    except OSError:
        sys.exit("本地文件操作失败，请检查输出目录的写入权限和剩余空间。")
    except KeyboardInterrupt:
        sys.exit("已中断。")
