from pathlib import Path
import re

index = Path('index.html')
js = Path('js/main.js')
tests = Path('tests/site-smoke.test.mjs')

html = index.read_text(encoding='utf-8')
schedule = re.compile(r'''\s*<div>\s*<label for="appointmentPeriod">Franja horaria</label>\s*<select id="appointmentPeriod" name="period" required>.*?</select>\s*</div>\s*<div>\s*<label for="appointmentTime">Horario deseado</label>\s*<select id="appointmentTime" name="time" required disabled>.*?</select>\s*<small id="appointmentTimeHelp">.*?</small>\s*</div>''', re.S)
new_schedule = '''
                                    <div>
                                        <label for="appointmentTime">Franja y horario</label>
                                        <input type="hidden" id="appointmentPeriod" name="period" value="">
                                        <select id="appointmentTime" name="time" required aria-describedby="appointmentTimeHelp">
                                            <option value="">Elegí mañana o tarde</option>
                                            <option value="morning">Mañana</option>
                                            <option value="afternoon">Tarde</option>
                                        </select>
                                        <small id="appointmentTimeHelp">Primero elegí una franja; después seleccioná uno de los horarios disponibles.</small>
                                    </div>'''
html, n = schedule.subn(new_schedule, html, count=1)
if n != 1:
    raise SystemExit('No se encontró el bloque de franja/horario esperado')

result = re.compile(r'''\s*<div id="appointmentRequestResult" class="appointment-result" aria-labelledby="appointmentRequestStatus" hidden>.*?</div>\s*<p id="appointmentRequestError"''', re.S)
new_result = '''
                            <div id="appointmentRequestResult" class="appointment-result" aria-labelledby="appointmentRequestStatus" hidden>
                                <p id="appointmentRequestStatus" class="appointment-status" role="status" aria-live="polite"></p>
                                <p class="appointment-followup">El turno debe ser confirmado por Piel de Mar después de recibir y revisar tu mensaje.</p>
                                <a class="btn primary appointment-resource-action" href="#recursos">Ver recursos gratuitos</a>
                            </div>
                            <p id="appointmentRequestError"'''
html, n = result.subn(new_result, html, count=1)
if n != 1:
    raise SystemExit('No se encontró el panel de resultado esperado')
index.write_text(html, encoding='utf-8')

source = js.read_text(encoding='utf-8')
start = source.index("    const appointmentForm = document.getElementById('appointmentRequestForm');")
end = source.index("    const currentYear = document.getElementById('currentYear');", start)
replacement = r'''    const appointmentForm = document.getElementById('appointmentRequestForm');
    if (appointmentForm) {
        const dateInput = document.getElementById('appointmentDate');
        const periodInput = document.getElementById('appointmentPeriod');
        const timeInput = document.getElementById('appointmentTime');
        const resultPanel = document.getElementById('appointmentRequestResult');
        const statusText = document.getElementById('appointmentRequestStatus');
        const errorText = document.getElementById('appointmentRequestError');
        const WHATSAPP_NUMBER = '5493425004018';

        function localDateString(date = new Date()) {
            const parts = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Argentina/Buenos_Aires',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).formatToParts(date);
            const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
            return `${values.year}-${values.month}-${values.day}`;
        }

        function setMinimumAppointmentDate() {
            const [year, month, day] = localDateString().split('-').map(Number);
            dateInput.min = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
        }
        setMinimumAppointmentDate();

        const APPOINTMENT_SLOTS = {
            morning: {
                label: 'Mañana',
                times: ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
            },
            afternoon: {
                label: 'Tarde',
                times: ['16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30']
            }
        };

        function renderPeriodOptions() {
            periodInput.value = '';
            timeInput.replaceChildren();
            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = 'Elegí mañana o tarde';
            timeInput.appendChild(placeholder);
            Object.entries(APPOINTMENT_SLOTS).forEach(([value, period]) => {
                const option = document.createElement('option');
                option.value = value;
                option.textContent = period.label;
                timeInput.appendChild(option);
            });
        }

        function renderTimeOptions(periodKey) {
            const period = APPOINTMENT_SLOTS[periodKey];
            if (!period) {
                renderPeriodOptions();
                return;
            }

            periodInput.value = periodKey;
            timeInput.replaceChildren();

            const changeOption = document.createElement('option');
            changeOption.value = '__change-period__';
            changeOption.textContent = '← Cambiar franja';
            timeInput.appendChild(changeOption);

            const placeholder = document.createElement('option');
            placeholder.value = '';
            placeholder.textContent = `Elegí un horario de ${period.label.toLowerCase()}`;
            placeholder.disabled = true;
            placeholder.selected = true;
            timeInput.appendChild(placeholder);

            period.times.forEach((time) => {
                const option = document.createElement('option');
                option.value = time;
                option.textContent = time;
                timeInput.appendChild(option);
            });
        }

        renderPeriodOptions();
        timeInput.addEventListener('change', () => {
            if (timeInput.value === 'morning' || timeInput.value === 'afternoon') {
                renderTimeOptions(timeInput.value);
            } else if (timeInput.value === '__change-period__') {
                renderPeriodOptions();
            }
        });

        function resetFeedback() {
            resultPanel.hidden = true;
            errorText.hidden = true;
            errorText.textContent = '';
        }
        appointmentForm.addEventListener('input', resetFeedback);
        appointmentForm.addEventListener('change', resetFeedback);

        function formatDate(date) {
            const [year, month, day] = date.split('-');
            return `${day}/${month}/${year}`;
        }

        appointmentForm.addEventListener('submit', (event) => {
            event.preventDefault();
            resetFeedback();
            if (!appointmentForm.reportValidity()) return;

            const formData = new FormData(appointmentForm);
            const payload = {
                name: String(formData.get('name') || '').trim(),
                insurance: String(formData.get('insurance') || '').trim(),
                reason: String(formData.get('reason') || '').trim(),
                date: String(formData.get('date') || ''),
                period: String(formData.get('period') || ''),
                time: String(formData.get('time') || '')
            };
            const selectedPeriod = APPOINTMENT_SLOTS[payload.period];
            if (!payload.name || !payload.insurance || !payload.reason ||
                !selectedPeriod || !selectedPeriod.times.includes(payload.time)) {
                errorText.textContent = 'Revisá los datos obligatorios y elegí una franja y un horario válidos.';
                errorText.hidden = false;
                return;
            }
            if (payload.date < dateInput.min) {
                dateInput.setCustomValidity('Elegí una fecha a partir de mañana.');
                dateInput.reportValidity();
                dateInput.setCustomValidity('');
                return;
            }

            const message = [
                'Hola, quiero solicitar un turno con Piel de Mar.',
                '',
                `Nombre: ${payload.name}`,
                `Obra social o cobertura: ${payload.insurance}`,
                `Motivo de la consulta: ${payload.reason}`,
                `Fecha deseada: ${formatDate(payload.date)}`,
                `Franja horaria: ${selectedPeriod.label}`,
                `Horario deseado: ${payload.time}`,
                '',
                'Entiendo que este mensaje es una solicitud y que el turno queda confirmado únicamente cuando reciba una respuesta de Piel de Mar por WhatsApp.'
            ].join('\\n');

            const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
            statusText.textContent = 'Tu solicitud fue preparada para WhatsApp. El turno todavía no está confirmado: quedará confirmado cuando Piel de Mar responda tu mensaje.';
            resultPanel.hidden = false;
            resultPanel.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });

            window.open(url, '_blank', 'noopener,noreferrer');
        });
    }

'''
js.write_text(source[:start] + replacement + source[end:], encoding='utf-8')

text = tests.read_text(encoding='utf-8')
text = re.sub(r"test\('appointment result explains manual WhatsApp sending and pending confirmation',[\s\S]*?\n\}\);", '''test('appointment result shows only pending confirmation and free resources', () => {
  assert.ok(html.includes('id="appointmentRequestResult"'));
  assert.match(html, /Ver recursos gratuitos/i);
  assert.doesNotMatch(html, /appointmentWhatsAppLink|appointmentMessagePreview|appointmentCopyButton/);
  assert.match(js, /turno todavía no está confirmado/i);
  assert.match(js, /window\\.open\\(url, '_blank'/);
  assert.match(js, /https:\\/\\/wa\\.me\\/\\$\\{WHATSAPP_NUMBER\\}\\?text=\\$\\{encodeURIComponent\\(message\\)\\}/);
  assert.match(js, /únicamente cuando reciba una respuesta de Piel de Mar por WhatsApp/i);
  assert.doesNotMatch(js, /appointmentMessagePreview|appointmentCopyButton|appointmentWhatsAppLink/);
});''', text, count=1)
text = re.sub(r"test\('appointment period dynamically displays the correct half-hour time slots',[\s\S]*?\n\}\);", '''test('appointment selector keeps period and time in the same control', () => {
  assert.match(js, /renderTimeOptions\\(timeInput\\.value\\)/);
  assert.match(js, /renderPeriodOptions\\(\\)/);
  assert.match(js, /selectedPeriod\\.times\\.includes\\(payload\\.time\\)/);
  assert.match(html, /id="appointmentPeriod"[^>]*type="hidden"/);
  assert.match(html, /id="appointmentTime"/);
  assert.doesNotMatch(html, /<label for="appointmentPeriod"/);
  assert.doesNotMatch(html, /id="appointmentTime"[^>]*disabled/);
  assert.match(js, /morning:[\\s\\S]*?'08:00'[\\s\\S]*?'11:30'/);
  assert.match(js, /afternoon:[\\s\\S]*?'16:00'[\\s\\S]*?'19:30'/);
});''', text, count=1)
tests.write_text(text, encoding='utf-8')
