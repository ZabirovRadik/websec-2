import requests
from bs4 import BeautifulSoup
from typing import List, Dict, Optional

def get_headers():
    return {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

def get_groups() -> List[Dict]:
    return [
        {"id": "1213641978", "name": "6413-100503D"},
        {"id": "1282690301", "name": "6411-100503D"},
        {"id": "1282690279", "name": "6412-100503D"},
    ]

def get_teachers() -> List[Dict]:
    return [
        {"id": "432837452", "name": "Юзькив Р.Р."},
        {"id": "114869468", "name": "Сергеев А.В."},
        {"id": "62061001", "name": "Мясников В.В."},
        {"id": "594502705", "name": "Чернышев П.В."},
        {"id": "335824546", "name": "Максимов А.И."},
        {"id": "664017039", "name": "Борисов А.Н."},
        {"id": "364272302", "name": "Агафонов А.А."},
        {"id": "147619112", "name": "Кузнецов А.В."},
        {"id": "333991624", "name": "Веричев А.В."},
        {"id": "544973937", "name": "Шапиро Д.А."},
    ]

def get_schedule(schedule_type: str, entity_id: str, week: Optional[int] = None) -> Dict:
    base_url = "https://ssau.ru/rasp"
    param_name = "groupId" if schedule_type == "group" else "staffId"
    params = {param_name: entity_id}
    if week is not None:
        params["selectedWeek"] = week

    url = f"{base_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
    response = requests.get(url, headers=get_headers())
    if response.status_code != 200:
        raise Exception(f"SSAU вернул {response.status_code}")

    soup = BeautifulSoup(response.text, "html.parser")

    week_span = soup.find('span', class_='week-nav-current_week')
    current_week = int(week_span.get_text(strip=True).split()[0]) if week_span else (week or 30)

    group_name = entity_id
    title = soup.select_one('.info-block__title') or soup.find('h1', class_='h1-text')
    if title:
        text = title.get_text(strip=True)
        group_name = text.replace('Расписание, ', '')

    days = []
    for head in soup.select('.schedule__head')[1:]:
        wd = head.select_one('.schedule__head-weekday')
        dt = head.select_one('.schedule__head-date')
        if wd and dt:
            days.append({"weekday": wd.get_text(strip=True).capitalize(), "date": dt.get_text(strip=True)})

    time_slots = []
    all_cells = []
    
    for item in soup.select('.schedule__item'):
        if 'schedule__head' in (item.get('class') or []):
            continue
        lessons = item.select('.schedule__lesson')
        cell_lessons = []
        
        for lesson in lessons:
            type_chip = lesson.select_one('.schedule__lesson-type-chip')
            type_text = type_chip.get_text(strip=True) if type_chip else ""

            subject = lesson.select_one('.schedule__discipline')
            subject = subject.get_text(strip=True) if subject else ""

            room = lesson.select_one('.schedule__place')
            room = room.get_text(strip=True) if room else ""

            teacher = lesson.select_one('.schedule__teacher')
            teacher = teacher.get_text(strip=True) if teacher else ""
            
            groups_block = lesson.select_one('.schedule__groups')
            
            group_info = ""
            subgroup = ""

            if groups_block:
                caption = groups_block.select_one('span.caption-text')
                if caption:
                    text = caption.get_text(strip=True)
                    if "подгруппы" in text.lower():
                        subgroup = text

                group_links = groups_block.select('a.schedule__group')
                if group_links:
                    names = [g.get_text(strip=True) for g in group_links]
                    group_info = ", ".join(names)
                    
            cell_lessons.append({
                "subject": subject,
                "type": type_text,
                "teacher": teacher,
                "room": room or "online",
                "subgroup": subgroup,
                "groups": group_info
            })

        all_cells.append(cell_lessons if cell_lessons else None)

    num_days = len(days) or 6
    grid = [all_cells[i:i + num_days] for i in range(0, len(all_cells), num_days)]

    for time_block in soup.select('.schedule__time'):
        times = time_block.select('.schedule__time-item')
        if len(times) >= 2:
            time_slots.append(f"{times[0].get_text(strip=True)} – {times[1].get_text(strip=True)}")

    while len(time_slots) < len(grid):
        time_slots.append("—")

    return {
        "week": current_week,
        "group_name": group_name,
        "days": days,
        "time_slots": time_slots[:len(grid)],
        "grid": grid
    }