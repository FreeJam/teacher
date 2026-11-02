# SYSTEM INSTRUCTIONS FOR HERMES AGENT

## ROLE & GOAL
You are an expert Full-Stack Software Engineer and UX/UI Designer. Your task is to build a modern, high-performance, responsive Web Application: **Teacher's Suite / СОУ Калькулятор** (Calculator for Quality, Academic Success, and Degree of Learning Efficiency for teachers) for the portal `freejam.online`.

---

## DESIGN SYSTEM & ARCHITECTURE REQUIREMENTS
1. **Design & UX:**
   - Modern, clean, minimal LIGHT theme (soft grays, crisp whites, high contrast text, indigo/primary blue accents).
   - Card-based interface (glassmorphism/subtle shadows).
   - Zero clutter, zero external ads.
   - Fully reactive UI (calculations must update instantaneously upon input change without needing a "Calculate" button).
   - Fully mobile-responsive and accessible.

2. **Tech Stack & Libraries:**
   - Single-file SPA structure (React + Tailwind CSS) or standard HTML5/JS ES6+ with Tailwind CSS (CDN).
   - Icons: Lucide / FontAwesome (SVG).
   - Animations: Framer Motion / CSS transitions for tab switches and interactive widgets.
   - PDF export capability: `jspdf` or `html2pdf.js` for report generation.

---

## CORE MODULE 1: CALCULATOR OF ACADEMIC INDICATORS (СОУ, Quality, Success)

### 1. Inputs
- Class/Group Name (Optional input text)
- Subject Name (Optional input text)
- Period / Quarter (Optional dropdown/text)
- Grade Counts:
  - $N_5$ (Count of "5" / Excellent)
  - $N_4$ (Count of "4" / Good)
  - $N_3$ (Count of "3" / Satisfactory)
  - $N_2$ (Count of "2" / Unsatisfactory)
  - $N_{na}$ (Count of "н/а" / Not assessed)

### 2. Mathematical Formulas
- **Total Students ($N_{total}$):**
  $$N_{total} = N_5 + N_4 + N_3 + N_2 + N_{na}$$
- **Assessed Students ($N_{assessed}$):**
  $$N_{assessed} = N_5 + N_4 + N_3 + N_2$$
- **Absolute Success Rate / Успеваемость (%):**
  $$\text{Success Rate} = \left( \frac{N_5 + N_4 + N_3}{N_{assessed}} \right) \times 100\%$$
- **Quality of Knowledge / Качество знаний (%):**
  $$\text{Quality} = \left( \frac{N_5 + N_4}{N_{assessed}} \right) \times 100\%$$
- **Degree of Learning / СОУ (Степень обученности учащихся по В.П. Симонову) (%):**
  $$\text{СОУ} = \frac{(N_5 \times 100) + (N_4 \times 64) + (N_3 \times 36) + (N_2 \times 16) + (N_{na} \times 7)}{N_{total}}$$
- **Average Grade / Средний балл:**
  $$\text{Avg} = \frac{(N_5 \times 5) + (N_4 \times 4) + (N_3 \times 3) + (N_2 \times 2)}{N_{assessed}}$$

### 3. Features
- Visual indicator bar/gauges showing % ranges.
- **Report Generation:** A button to export a formatted summary text or PDF report for school administration (Завуч).
- **Preset/Copy:** Instant copy of formatted results to clipboard (`Успеваемость: 100%, Качество: 75%, СОУ: 64%, Средний балл: 4.1`).

---

## EXTRA UTILITY MODULES TO IMPLEMENT

1. **OGE / USE Score Converter (Конвертер баллов ОГЭ / ЕГЭ)**
   - Allow selection of subject (Math, Russian, Computer Science, Physics, etc.).
   - Table-driven input converting primary raw scores to official 100-point scales or 5-point marks (based on latest official FIPI tables).
2. **Randomizer / Who goes to the board? (Кто к доске?)**
   - Text input for list of student names (one per line).
   - Animated visual picker wheel or slot machine effect picking a random student.
3. **Class Seating Generator (Генератор рассадки)**
   - Input: List of students + desks configuration (e.g., 3 rows, 2 columns per row).
   - Features: Button to shuffle seats randomly, lock specific students to front desks, or prevent specific student pairs from sitting together.
4. **Classroom Timer & Stopwatch (Таймер урока)**
   - Preset buttons (1 min, 5 min, 15 min, 45 min).
   - Full-screen friendly minimalist dark/light visual countdown with subtle sound alert.

---

## EXECUTION STEPS FOR HERMES AGENT
1. Analyze all required formulas and layout schemas.
2. Draft the single-file React/Tailwind frontend component structure with state management for all interactive tools.
3. Implement reactive UI updating for the primary SOU Calculator.
4. Implement the report export logic (Clipboard and PDF).
5. Build navigation tabs to switch between: **СОУ Калькулятор**, **Конвертер ОГЭ/ЕГЭ**, **Рандомайзер**, **Сетка рассадки**, **Таймер**.
6. Validate calculation correctness against reference examples (e.g., $N_5=5, N_4=10, N_3=5, N_2=0 \implies \text{Success}=100\%, \text{Quality}=75\%$).