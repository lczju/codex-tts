from pathlib import Path


def test_github_pages_workflow_deploys_web_directory():
    workflow_path = Path(".github/workflows/deploy-pages.yml")

    assert workflow_path.exists(), "Expected GitHub Pages workflow to exist"

    content = workflow_path.read_text(encoding="utf-8")

    assert "upload-pages-artifact" in content
    assert "deploy-pages" in content
    assert "path: ./web" in content
