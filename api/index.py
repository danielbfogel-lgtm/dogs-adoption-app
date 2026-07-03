from fastapi import FastAPI

app = FastAPI()


@app.get("/api")
@app.get("/api/")
def status():
    return {"status": "Python is running"}
