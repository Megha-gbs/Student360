# Handoff: Real Sem1 -> Sem2 Trajectory Engine (Smruthi's Scope)

**Owner**: Smruthi  
**Target Consumers**: Sireesha (FastAPI Backend), Yashwanth (React Frontend)  
**Blueprint Compliance**: Upgrade 2 (Real Curricular Units Journey, Not Synthetic Points)

---

## 1. Frozen API Contract

### Real Sem1 -> Sem2 Trajectory (`trajectory_data`)
Embedded inside the `GET /students/{id}` response payload:

```json
{
  "trajectory_type": "real_sem1_to_sem2",
  "points": [
    {
      "semester": "Sem 1",
      "risk_score": 41,
      "approved_units": 5,
      "grade": 12.3
    },
    {
      "semester": "Sem 2",
      "risk_score": 78,
      "approved_units": 3,
      "grade": 9.1
    }
  ],
  "note": "Based on actual 1st vs 2nd semester curricular units from the dataset"
}
```

#### Field Specifications:
- `trajectory_type` (`"real_sem1_to_sem2"`): Constant identifier indicating honest 2-semester historical curricular data.
- `points` (`array` of length 2):
  - `semester` (`"Sem 1" | "Sem 2"`): Academic semester milestone. (Weekly synthetic points are strictly disallowed).
  - `risk_score` (`integer`, 0–100): Academic dropout risk probability score.
  - `approved_units` (`number`): Curricular units approved in that semester.
  - `grade` (`number`): Semester grade average (Portuguese higher education scale 0–20).
- `note` (`string`): Mandatory transparency label: `"Based on actual 1st vs 2nd semester curricular units from the dataset"`.

---

## 2. Priority Queue Trend Helper (`trend`)

For the `GET /students` priority queue endpoint:
```json
{
  "student_id": "S1023",
  "risk_score": 78,
  "risk_level": "High",
  "trend": "Deteriorating",
  "priority": "High"
}
```

`calculate_student_trend(trajectory)` computes:
- `"Deteriorating"`: Sem 2 risk increased by $\ge 5$ points compared to Sem 1.
- `"Improving"`: Sem 2 risk decreased by $\ge 5$ points compared to Sem 1.
- `"Stable"`: Risk changed by $< 5$ points.

---

## 3. FastAPI Backend Integration (For Sireesha)

```python
from ml.trajectory import (
    Sem1Sem2TrajectoryGenerator,
    calculate_student_trend,
    generate_student_trajectory,
)

# Option 1: Convenience Function
trajectory = generate_student_trajectory(
    student_data=student_dict,
    risk_score_sem2=predicted_risk_score, # e.g. 78 from Mohith
)
# Returns exact frozen trajectory dict

trend = calculate_student_trend(trajectory)
# Returns: "Deteriorating", "Improving", or "Stable"

# Option 2: Class with Dual-Model Support
generator = Sem1Sem2TrajectoryGenerator(
    model_full=loaded_xgb_full_model,
    model_sem1=loaded_xgb_sem1_model, # optional dual model
)
trajectory_resp = generator.generate_trajectory(student_dict)
trajectory_dict = trajectory_resp.to_dict()
```

---

## 4. Frontend Rendering Notes (For Yashwanth)

- Render the 2 points directly in Recharts `<LineChart>` or `<AreaChart>`.
- Use the X-axis key: `"semester"` (`"Sem 1"` and `"Sem 2"`).
- Y-axis keys: `"risk_score"` (left axis, 0–100) and `"grade"` / `"approved_units"` (secondary tooltip or right axis).
- Display the disclaimer note beneath the chart:
  > *"Based on actual 1st vs 2nd semester curricular units from the dataset"*
