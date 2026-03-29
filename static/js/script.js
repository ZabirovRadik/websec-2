$(document).ready(function () {
    let currentType = 'group';
    let currentId = null;
    let currentWeek = 30;
    let scheduleData = null;
    let selectedDayIndex = null;

    let allGroups = [];
    let allTeachers = [];

    const dayShort = {
        "Понедельник": "Пн", "Вторник": "Вт", "Среда": "Ср",
        "Четверг": "Чт", "Пятница": "Пт", "Суббота": "Сб"
    };

    const lessonTypes = {
        'лекция': { class: 'lesson-lecture', color: '#28a745', bg: '#e8f5e9', name: 'Лекция' },
        'лекции': { class: 'lesson-lecture', color: '#28a745', bg: '#e8f5e9', name: 'Лекция' },
        'практика': { class: 'lesson-practice', color: '#17a2b8', bg: '#e1f5fe', name: 'Практика' },
        'практические': { class: 'lesson-practice', color: '#17a2b8', bg: '#e1f5fe', name: 'Практика' },
        'лабораторная': { class: 'lesson-lab', color: '#e83e8c', bg: '#fce4ec', name: 'Лабораторная' },
        'лабораторные': { class: 'lesson-lab', color: '#e83e8c', bg: '#fce4ec', name: 'Лабораторная' },
        'экзамен': { class: 'lesson-exam', color: '#004085', bg: '#cce5ff', name: 'Экзамен' },
        'зачёт': { class: 'lesson-credit', color: '#ffc107', bg: '#fff3cd', name: 'Зачёт' },
        'зачет': { class: 'lesson-credit', color: '#ffc107', bg: '#fff3cd', name: 'Зачёт' },
        'консультация': { class: 'lesson-consult', color: '#20c997', bg: '#d1f7f0', name: 'Консультация' },
        'другое': { class: 'lesson-other', color: '#fd7e14', bg: '#fff0e6', name: 'Другое' },
        'иот': { class: 'lesson-iot', color: '#6f42c1', bg: '#e9d8ff', name: 'ИОТ' }
    };

    function getLessonTypeStyle(type) {
        const lowerType = type?.toLowerCase() || '';
        for (let [key, value] of Object.entries(lessonTypes)) {
            if (lowerType.includes(key)) {
                return value;
            }
        }
        return { class: 'lesson-other', color: '#fd7e14', bg: '#fff0e6', name: 'Другое' };
    }

    function updateHeaderTitle() {
        console.log('updateHeaderTitle вызван, currentId:', currentId, 'currentType:', currentType);
        console.log('allGroups:', allGroups);
        console.log('allTeachers:', allTeachers);
        
        if (!currentId) {
            $('#entity-name').text('Выберите группу или преподавателя');
            return;
        }
        
        if (currentType === 'group') {
            const group = allGroups.find(g => String(g.id) === String(currentId));
            console.log('Найденная группа:', group);
            if (group) {
                $('#entity-name').text(group.name);
            } else {
                $('#entity-name').text('Загрузка...');
            }
        } else if (currentType === 'teacher') {
            const teacher =  allTeachers.find(t => String(t.id) === String(currentId));
            console.log('Найденный преподаватель:', teacher);
            if (teacher) {
                $('#entity-name').text(teacher.name);
            } else {
                $('#entity-name').text('Загрузка...');
            }
        }
    }

    function loadDirectories() {
        console.log('Загрузка групп...');
        $.getJSON('/api/groups', function (groups) { 
            allGroups = groups; 
            console.log('Группы загружены:', allGroups);
            updateDropdowns(); 
            updateHeaderTitle();
            
            if (!currentId && allGroups.length) {
                currentId = allGroups[0].id;
                currentType = 'group';
                console.log('Автовыбор группы:', currentId);
                updateHeaderTitle();
                loadSchedule();
            }
        }).fail(function() {
            console.error('Ошибка загрузки групп');
        });
        
        console.log('Загрузка преподавателей...');
        $.getJSON('/api/teachers', function (teachers) { 
            allTeachers = teachers; 
            console.log('Преподаватели загружены:', allTeachers);
            updateDropdowns(); 
            updateHeaderTitle();
        }).fail(function() {
            console.error('Ошибка загрузки преподавателей');
        });
    }

    function updateDropdowns() {
        const groupMenu = $('#groupDropdownMenu');
        groupMenu.empty();
        if (allGroups.length) {
            allGroups.forEach(group => {
                const active = (group.id === currentId && currentType === 'group') ? 'active' : '';
                groupMenu.append(`
                    <li>
                        <a class="dropdown-item ${active}" href="#" data-type="group" data-id="${group.id}">
                            ${group.name}
                        </a>
                    </li>
                `);
            });
        } else {
            groupMenu.append('<li><h6 class="dropdown-header">Нет групп</h6></li>');
        }

        const teacherMenu = $('#teacherDropdownMenu');
        teacherMenu.empty();
        if (allTeachers.length) {
            allTeachers.forEach(teacher => {
                const active = (teacher.id === currentId && currentType === 'teacher') ? 'active' : '';
                teacherMenu.append(`
                    <li>
                        <a class="dropdown-item ${active}" href="#" data-type="teacher" data-id="${teacher.id}">
                            ${teacher.name}
                        </a>
                    </li>
                `);
            });
        } else {
            teacherMenu.append('<li><h6 class="dropdown-header">Нет преподавателей</h6></li>');
        }
    }

    function populateWeekSelect() {
        const select = $('#week-select');
        select.empty();
        for (let i = 1; i <= 52; i++) {
            select.append(`<option value="${i}" ${i === currentWeek ? 'selected' : ''}>Неделя ${i}</option>`);
        }
    }

    function loadSchedule() {
        if (!currentId) return;
        
        console.log('Загрузка расписания для:', currentType, currentId);
        
        $.getJSON(`/api/schedule?type=${currentType}&id=${currentId}&week=${currentWeek}`, function (data) {
            console.log('Расписание загружено');
            scheduleData = data;
            currentWeek = data.week;
            $('#current-week').text(currentWeek);
            
            renderPCTable(data);
            populateWeekSelect();
            renderMobileDays(data);
            renderMobileLessons(data, null);
            updateDropdowns();
        }).fail(function() {
            console.error('Ошибка загрузки расписания');
        });
    }

    function renderPCTable(data) {
        let header = '<th class="text-center fw-bold" style="width: 100px; background: #f8f9fa;">Время</th>';
        data.days.forEach(day => {
            header += `<th class="text-center" style="background: #f8f9fa;">${day.weekday}<br><small>${day.date}</small></th>`;
        });
        $('#days-header').html(header);

        const tbody = $('#schedule-body');
        tbody.empty();

        let maxLessonsInCell = 0;
        if (data.grid) {
            data.grid.forEach(rowCells => {
                if (rowCells) {
                    rowCells.forEach(cell => {
                        if (cell) {
                            const lessons = Array.isArray(cell) ? cell : [cell];
                            maxLessonsInCell = Math.max(maxLessonsInCell, lessons.length);
                        }
                    });
                }
            });
        }
        
        const cellHeight = maxLessonsInCell > 0 ? maxLessonsInCell * 95 : 80;

        data.time_slots.forEach((time, rowIdx) => {
            const rowCells = data.grid[rowIdx] || [];
            
            let row = `<tr><td class="fw-bold text-center time-cell" style="background: #f8f9fa;">${time}<\/td>`;
            
            for (let dayIdx = 0; dayIdx < data.days.length; dayIdx++) {
                const cell = rowCells[dayIdx];
                let lessons = [];

                if (!cell) {
                    lessons = [];
                } else if (Array.isArray(cell)) {
                    lessons = cell;
                } else {
                    lessons = [cell];
                }

                if (!lessons.length) {
                    row += `<td class="empty-cell" style="height: ${cellHeight}px;"><div class="empty-lesson">—<\/div><\/td>`;
                    continue;
                }

                row += `<td class="lesson-cell" style="height: ${cellHeight}px;">`;
                
                lessons.forEach((lesson) => {
                    const typeStyle = getLessonTypeStyle(lesson.type);
                    
                    row += `
                    <div class="lesson ${typeStyle.class}" style="border-left-color: ${typeStyle.color}; background: ${typeStyle.bg};">
                        <div class="lesson-type-badge" style="background: ${typeStyle.color};">
                            ${typeStyle.name}
                        </div>
                        <div class="lesson-subject">
                            <strong>${lesson.subject || ''}</strong>
                        </div>
                        ${lesson.teacher ? `<div class="lesson-teacher"><i class="bi bi-person"></i> ${lesson.teacher}</div>` : ''}
                        ${lesson.room ? `<div class="lesson-room"><i class="bi bi-geo-alt"></i> ${lesson.room}</div>` : ''}
                        ${(lesson.subgroup || lesson.groups) ? `<div class="lesson-groups"><i class="bi bi-people-fill"></i> ${lesson.subgroup || lesson.groups}</div>` : ''}
                    </div>`;
                });
                
                row += `<\/td>`;
            }
            row += '<\/tr>';
            tbody.append(row);
        });
    }

    function renderMobileDays(data) {
        const container = $('#mobile-days');
        container.empty();

        let html = `<div class="mobile-days-row">`;
        data.days.forEach((day, idx) => {
            const short = dayShort[day.weekday] || day.weekday.substring(0,2);
            const num = day.date.split('.')[0];
            const isSelected = (idx === selectedDayIndex) ? 'selected' : '';
            html += `
                <div class="mobile-day ${isSelected}" onclick="loadDay(${idx})">
                    <div class="mobile-day-name">${short}</div>
                    <div class="mobile-day-number">${num}</div>
                </div>`;
        });
        html += `</div>`;
        container.html(html);
    }

    function renderMobileLessons(data, dayIndex = null) {
        const container = $('#mobile-lessons');
        container.empty();

        if (dayIndex === null) {
            data.days.forEach((day, dayIdx) => {
                const dayHeader = `
                    <div class="mobile-day-header">
                        <h5 class="mb-2">${day.weekday}</h5>
                        <small class="text-muted">${day.date}</small>
                    </div>
                `;
                container.append(dayHeader);
                addDayLessons(data, dayIdx, container);
            });
        } else {
            addDayLessons(data, dayIndex, container);
        }
    }

    function addDayLessons(data, dayIdx, container) {
        let hasLessons = false;
        
        for (let rowIdx = 0; rowIdx < data.grid.length; rowIdx++) {
            const rowCells = data.grid[rowIdx] || [];
            const cell = rowCells[dayIdx];

            let lessons = [];

            if (!cell) lessons = [];
            else if (Array.isArray(cell)) lessons = cell;
            else lessons = [cell];

            if (!lessons.length) continue;
            
            hasLessons = true;

            lessons.forEach(lesson => {
                const typeStyle = getLessonTypeStyle(lesson.type);
                const time = data.time_slots[rowIdx] || '—';

                const block = `
                    <div class="mobile-lesson" style="border-left-color: ${typeStyle.color};">
                        <div class="mobile-lesson-header">
                            <span class="lesson-type-badge" style="background: ${typeStyle.color};">
                                ${typeStyle.name}
                            </span>
                            <span class="lesson-time">${time}</span>
                        </div>
                        
                        <div class="lesson-subject">
                            <strong>${lesson.subject || 'Без названия'}</strong>
                        </div>
                        
                        ${lesson.teacher ? `
                        <div class="lesson-teacher">
                            <i class="bi bi-person"></i> ${lesson.teacher}
                        </div>
                        ` : ''}
                        
                        ${lesson.room ? `
                        <div class="lesson-room">
                            <i class="bi bi-geo-alt"></i> ${lesson.room}
                        </div>
                        ` : ''}
                        
                        ${(lesson.subgroup || lesson.groups) ? `
                        <div class="lesson-groups">
                            <i class="bi bi-people-fill"></i> ${lesson.subgroup || lesson.groups}
                        </div>
                        ` : ''}
                    </div>
                `;

                container.append(block);
            });
        }
        
        if (!hasLessons) {
            container.append(`
                <div class="text-center text-muted py-4">
                    <i class="bi bi-calendar-x fs-1"></i>
                    <p class="mt-2">Нет пар</p>
                </div>
            `);
        }
    }

    window.loadDay = function (idx) {
        selectedDayIndex = idx;
        renderMobileDays(scheduleData);
        renderMobileLessons(scheduleData, idx);
    };

    $(document).on('click', '.dropdown-item', function(e) {
        e.preventDefault();
        const newType = $(this).data('type');
        const newId = $(this).data('id');
        
        console.log('Выбран элемент:', newType, newId);
        
        currentType = newType;
        currentId = newId;
        selectedDayIndex = null;
        
        updateHeaderTitle();
        
        loadSchedule();
        $('.dropdown').removeClass('show');
        $('.dropdown-menu').removeClass('show');
    });

    $('#btn-prev-week').on('click', () => { currentWeek--; loadSchedule(); });
    $('#btn-next-week').on('click', () => { currentWeek++; loadSchedule(); });
    $('#btn-current-week').on('click', () => { 
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
        currentWeek = weekNumber;
        loadSchedule(); 
    });

    $('#week-select').on('change', function () {
        currentWeek = parseInt($(this).val());
        loadSchedule();
    });

    loadDirectories();
});