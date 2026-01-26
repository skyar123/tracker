# Data Structure Comparison: Python vs JavaScript App

## Field Mapping

### Python Structure → App Structure

| Python Field | App Field | Status | Notes |
|-------------|-----------|--------|-------|
| `id` | `id` | ✅ Match | Both use IDs |
| `child_name` | `name` | ✅ Match | Same data |
| `child_dob` | `dob` | ✅ Match | Same data |
| `caregiver_name` | `caregiver` | ✅ Match | Same data |
| `caregiver_dob` | ❌ Missing | ⚠️ Missing | Could use `customFields.caregiverDob` |
| `intake_date` | `admitDate` | ✅ Match | Same concept |
| `diagnosis_code` | ❌ Missing | ⚠️ Missing | Could use `customFields.diagnosisCode` |
| `diagnosis` | ❌ Missing | ⚠️ Missing | Could use `customFields.diagnosis` or `notes` |
| `initial_cca_date` | ❌ Missing | ⚠️ Missing | Not tracked |
| `sixty_day_cca_date` | ❌ Missing | ⚠️ Missing | Not tracked |
| `initial_tx_plan` | ❌ Missing | ⚠️ Missing | Not tracked |
| `sixty_day_tx_plan` | ❌ Missing | ⚠️ Missing | Not tracked |
| `ninety_day_tx_plan` | ❌ Missing | ⚠️ Missing | Not tracked |
| `next_tx_plan` | ❌ Missing | ⚠️ Missing | Not tracked |
| `insurance_submitted` | ❌ Missing | ⚠️ Missing | Not tracked |
| `insurance_accepted` | ❌ Missing | ⚠️ Missing | Not tracked |
| `insurance_type` | ❌ Missing | ⚠️ Missing | Not tracked |
| `auth_submitted` | ❌ Missing | ⚠️ Missing | Not tracked |
| `auth_accepted` | ❌ Missing | ⚠️ Missing | Not tracked |
| `auth_expires` | ❌ Missing | ⚠️ Missing | Not tracked |
| `asd_caregiver_id` | ❌ Missing | ⚠️ Missing | Not tracked |
| `asd_client_id` | ❌ Missing | ⚠️ Missing | Not tracked |
| `caregiver_b_id` | ❌ Missing | ⚠️ Missing | Not tracked |
| `has_crisis_plan` | ❌ Missing | ⚠️ Missing | Not tracked |
| `nickname` | `nickname` | ✅ Match | App has this, Python doesn't |
| `type` | `type` | ✅ Match | App has this, Python doesn't |
| `status` | `status` | ✅ Match | App has this, Python doesn't |
| `customFields` | `customFields` | ✅ Match | App has this, Python doesn't |

## Assessment Structure Differences

### Python Structure
```python
baseline_assessments: {
  "SNIFF": {
    "completed": "2025-04-27",
    "uploaded": "2025-04-27"  # or "yes"
  }
}
```

### App Structure
```javascript
assessments: {
  "base_sniff": "2025-04-27"  // Just date string, no upload tracking
}
```

## Key Missing Features in App

1. **Upload Status Tracking**: Python tracks if assessments are uploaded, app only tracks completion dates
2. **Treatment Plan Dates**: Python tracks multiple treatment plan dates (initial, 60-day, 90-day, next)
3. **CCA Dates**: Python tracks initial and 60-day CCA dates
4. **Insurance/Auth Tracking**: Python tracks insurance submission/acceptance and authorization dates
5. **ASD System IDs**: Python tracks external system IDs
6. **Crisis Plan Flag**: Python tracks if client has crisis plan

## Recommendations

1. **Add upload tracking** to assessments (store as objects with `completed` and `uploaded` fields)
2. **Add treatment plan date fields** to client structure
3. **Add CCA date fields** to client structure
4. **Add insurance/auth fields** to client structure (or use customFields)
5. **Add crisis plan flag** to client structure
