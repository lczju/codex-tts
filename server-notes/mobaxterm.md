# MobaXterm Notes

## Basic Workflow

1. Create an SSH session for the GPU server.
2. Use the terminal panel to run setup, inference, and training commands.
3. Use the SFTP panel to upload datasets and download generated audio.
4. Use SSH tunneling when a remote web UI needs to be opened locally.

## Common Remote Ports

- Gradio: 7860
- FastAPI: 8000
- Jupyter: 8888

## Local Result Download Target

Generated audio should be downloaded into:

```text
web/audio/<model-name>/
```

Example:

```text
web/audio/cosyvoice/case_001.wav
web/audio/vits/case_001.wav
```

