from fastapi import APIRouter

router = APIRouter()


@router.get("/api")
@router.get("/api/")
def status():
    return {"status": "Python is running"}
