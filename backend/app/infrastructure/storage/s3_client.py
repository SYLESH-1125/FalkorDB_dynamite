import json
from functools import lru_cache

import boto3

from app.config import settings


@lru_cache
def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint_url,
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
    )


def ensure_bucket() -> None:
    client = get_s3_client()
    try:
        client.head_bucket(Bucket=settings.s3_bucket)
    except Exception:
        client.create_bucket(Bucket=settings.s3_bucket)


def put_object(key: str, body: bytes, content_type: str) -> None:
    get_s3_client().put_object(
        Bucket=settings.s3_bucket, Key=key, Body=body, ContentType=content_type,
    )


def put_json(key: str, data: dict) -> None:
    put_object(key, json.dumps(data).encode("utf-8"), "application/json")


def get_object_bytes(key: str) -> bytes:
    resp = get_s3_client().get_object(Bucket=settings.s3_bucket, Key=key)
    return resp["Body"].read()


def head_object(key: str) -> bool:
    try:
        get_s3_client().head_object(Bucket=settings.s3_bucket, Key=key)
        return True
    except Exception:
        return False


def delete_object(key: str) -> None:
    get_s3_client().delete_object(Bucket=settings.s3_bucket, Key=key)
