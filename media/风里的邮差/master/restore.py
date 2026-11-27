"""Reassemble the original H.264 export from the three files next to this script."""
from hashlib import sha256
from pathlib import Path
import os
import tempfile

HERE = Path(__file__).resolve().parent
OUTPUT = HERE.parent / "风里的邮差.mp4"
PARTS = ("wind-postman.mp4.001", "wind-postman.mp4.002", "wind-postman.mp4.003")
DIGEST = "83e209927be3dbb3b440b66df5502e564af6992a059c8336aa4b29d1ac9f22b2"


def chunks(stream):
    return iter(lambda: stream.read(1024 * 1024), b"")


def verify_existing():
    fingerprint = sha256()
    with OUTPUT.open("rb") as existing:
        for block in chunks(existing):
            fingerprint.update(block)
    if fingerprint.hexdigest() != DIGEST:
        raise SystemExit(f"已有同名文件，内容与原片不同，请先移开：{OUTPUT}")
    print(f"原始成片已就绪，SHA-256 校验通过：{OUTPUT}")


def main():
    if OUTPUT.exists():
        verify_existing()
        return
    # Publish the verified result in a single step; an existing output wins the race.
    with tempfile.NamedTemporaryFile(dir=OUTPUT.parent, delete=False) as work:
        temporary = Path(work.name)
    try:
        fingerprint = sha256()
        with temporary.open("wb") as out:
            for name in PARTS:
                with (HERE / name).open("rb") as part:
                    for block in chunks(part):
                        out.write(block)
                        fingerprint.update(block)
        if fingerprint.hexdigest() != DIGEST:
            raise SystemExit("原片校验失败，请重新下载三个分卷。")
        try:
            os.link(temporary, OUTPUT)
        except FileExistsError:
            verify_existing()
        else:
            print(f"已还原原始成片，SHA-256 校验通过：{OUTPUT}")
    finally:
        temporary.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
