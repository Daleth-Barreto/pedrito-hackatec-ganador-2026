from pathlib import Path
from typing import Protocol
from uuid import uuid4

from app.core.config import get_settings


class ImageStorage(Protocol):
    def save(self, content: bytes) -> str: ...
    def read(self, key: str) -> bytes: ...
    def delete(self, key: str) -> None: ...


class LocalStorage:
    def __init__(self, root: Path):
        self.root = root.resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if path.parent != self.root or path.suffix != ".jpg":
            raise ValueError("Invalid storage key")
        return path

    def save(self, content: bytes) -> str:
        key = f"{uuid4()}.jpg"
        with self._path(key).open("xb") as image:
            image.write(content)
        return key

    def read(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    def delete(self, key: str) -> None:
        self._path(key).unlink(missing_ok=True)


def get_storage() -> ImageStorage:
    return LocalStorage(get_settings().storage_path)
