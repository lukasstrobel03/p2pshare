## JSON-RPC

We use **JSON-RPC** for our API. Like **REST API**, it is based on **HTTP**, but simpler. You can think of it as a REST API where the HTTP method is fixed to `POST` and the HTTP path is fixed to `/`.

## Format

### Request

Every JSON-RPC request includes a fixed field `"jsonrpc": "2.0"` and a custom ID `id`, which should be unique for each request. Additionally, there is a `method` field, whose value is a string, and an optional `params` field, which can be of any custom type.

A typical JSON-RPC request looks like this:

```json
{
    "jsonrpc": "2.0",
    "id": 8343,
    "method": "download",
    "params": {
        "id": "06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393",
        "outdir": "./data"
    }
}
```

In the following descriptions, we will only include the `method` and `params` fields, which carry the actual business logic.

### Response

The JSON-RPC response also includes `jsonrpc` and `id` fields, which must be identical to those in the request. This helps the client match responses to their corresponding requests.

In the response, the `result` and `error` fields are mutually exclusive; only one of them will appear. The value of `result` can be of any custom type, whereas the `error` field has a fixed structure.

The `error` object includes an integer error `code` and a string `message`. Here is a table of error codes and their messages. In most cases, however, you can just print the message directly.

| Code   | Message          |
| ------ | ---------------- |
| -32700 | Parse Error      |
| -32601 | Method Not Found |
| -32602 | Invalid Params   |
| -32000 | Server Error     |

A typical JSON-RPC response looks like this:

```json
{
    "jsonrpc": "2.0",
    "id": 8343,
    "result": {
        "ok": true,
        "output": "data/file"
    }
}
```

or

```json
{
    "jsonrpc": "2.0",
    "id": 8343,
    "error": {
        "code": -32601,
        "message": "Method Not Found"
    }
}
```

The following API descriptions will focus only on the content within the `result` field.

## API

### status

Get node ID and peer count.

#### Request

```json
{
    "method": "status"
}
```

#### Response

```json
{
    "result": {
        "id": "06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393",
        "peers": 3
    }
}
```

### peers

Get all peers.

#### Request

```json
{
    "method": "peers"
}
```

#### Response

```json
{
    "result": [
        {
            "id": "06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393",
            "addr": "1.1.1.1:2222"
        },
        {
            "id": "d397d953824bc224b2098a45cbc81bbdcec7b9c7f22dd503b9aa8917e100cb2d",
            "addr": "2.2.2.2:3333"
        }
    ]
}
```

### listFiles

Get information on all files published by this node.

#### Request

```json
{
    "method": "listFiles"
}
```

#### Response

```json
{
    "result": [
        {
            "id": "06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393",
            "name": "file1",
            "size": 3846,
            "chunk_size": 262144,
            "chunks": 3
        },
        {
            "id": "d397d953824bc224b2098a45cbc81bbdcec7b9c7f22dd503b9aa8917e100cb2d",
            "name": "file2",
            "size": 34874,
            "chunk_size": 262144,
            "chunks": 30
        }
    ]
}
```

### publish

Publish a local file to the DHT network.

#### Request

```json
{
    "method": "publish",
    "params": {
        "path": "../file"
    }
}
```

#### Response

```json
{
    "result": {
        "id": "06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393",
        "manifest": {
            "name": "file",
            "size": 352123,
            "chunk_size": 262144,
            "chunks": [
                "d397d953824bc224b2098a45cbc81bbdcec7b9c7f22dd503b9aa8917e100cb2d",
                "c2c3b8feacb50670550e1ef18d96b266b656ed11149df3cf514b9aa6e37f1105"
            ]
        }
    }
}
```

### download

Download a file from the DHT network.

#### Request

```json
{
    "method": "download",
    "params": {
        "id": "06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393",
        "outdir": "."
    }
}
```

#### Response

```json
{
    "result": {
        "ok": true,
        "output": "file"
    }
}
```

### bootstrap

Add bootstrap nodes to the local node.

#### Request

```json
{
    "method": "bootstrap",
    "params": [
        {
            "id": "06ba16f807e192bc0cc9b000aa7ea51c37a01c01b01e228806f468b525488393",
            "addr": "1.1.1.1:2222"
        },
        {
            "id": "d397d953824bc224b2098a45cbc81bbdcec7b9c7f22dd503b9aa8917e100cb2d",
            "addr": "2.2.2.2:3333"
        }
    ]
}
```

#### Response

```json
{
    "result": {
        "ok": true
    }
}
```
