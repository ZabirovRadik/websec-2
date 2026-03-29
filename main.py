from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Optional
from pydantic import BaseModel

from scraper import get_groups, get_teachers, get_schedule

app = FastAPI(title="SSAU Расписание — Лаба 2")

app.mount("/static", StaticFiles(directory="static"), name="static")

class Group(BaseModel):
    id: str
    name: str

class Teacher(BaseModel):
    id: str
    name: str

class Pair(BaseModel):
    time: str
    subject: str
    type: str
    teacher: str
    room: str

class Day(BaseModel):
    date: str
    weekday: str
    pairs: List[Pair]

class Schedule(BaseModel):
    week: int
    group_name: Optional[str] = None
    teacher_name: Optional[str] = None
    days: List[Day]

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.get("/api/groups")
async def api_groups():
    return get_groups()

@app.get("/api/teachers")
async def api_teachers():
    return get_teachers()

@app.get("/api/schedule")
async def api_schedule(type: str = "group", id: str = None, week: Optional[int] = None):
    if not id:
        raise HTTPException(status_code=400, detail="Нужен id")
    if type not in ["group", "teacher"]:
        raise HTTPException(status_code=400, detail="type = group или teacher")
    try:
        return get_schedule(type, id, week)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)