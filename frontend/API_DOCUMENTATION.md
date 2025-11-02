# Vehicle Management System - API Documentation

## Overview
This document describes the REST API endpoints for integrating with the Vehicle Management System from your Flask backend.

## Base URL
Your API endpoint will be available at:
```
https://<your-project-ref>.supabase.co/functions/v1/
```

## Authentication
The API uses anonymous access for the detection submission endpoint, allowing your Flask backend to submit detections without authentication.

## Endpoints

### POST /submit-detection

Submit a new vehicle detection from the AI system.

**Endpoint:** `POST /submit-detection`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "plate_number": "ABC1234",
  "image_url": "https://example.com/capture1.jpg",
  "confidence_score": 0.92,
  "vehicle_type": "Car",
  "owner_name": "John Doe",
  "verification_status": "Resident"
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| plate_number | string | Yes | Vehicle license plate number (will be converted to uppercase) |
| image_url | string | No | URL to the captured vehicle image |
| confidence_score | number | No | OCR confidence score (0.0 to 1.0) |
| vehicle_type | string | No | Type of vehicle (Car, Bike, Truck, etc.) |
| owner_name | string | No | Name of the vehicle owner (if known) |
| verification_status | string | No | Status: "Resident", "Visitor", or "Unknown" (default: "Unknown") |

**Success Response:**
```json
{
  "success": true,
  "detection": {
    "id": "uuid",
    "plate_number": "ABC1234",
    "image_url": "https://example.com/capture1.jpg",
    "confidence_score": 0.92,
    "detection_time": "2025-01-01T12:00:00Z",
    "vehicle_type": "Car",
    "owner_name": "John Doe",
    "verification_status": "Resident"
  },
  "is_resident": true,
  "resident_info": {
    "id": "uuid",
    "plate_number": "ABC1234",
    "vehicle_type": "Car",
    "owner_name": "John Doe",
    "flat_number": "A-101",
    "phone": "+91 1234567890",
    "is_resident": true
  }
}
```

**Error Response:**
```json
{
  "error": "Error message description"
}
```

**Status Codes:**
- `200 OK` - Detection successfully processed
- `400 Bad Request` - Missing required fields
- `500 Internal Server Error` - Server error

## Example Usage

### Python (Flask/Requests)
```python
import requests

url = "https://<your-project-ref>.supabase.co/functions/v1/submit-detection"

data = {
    "plate_number": "ABC1234",
    "image_url": "https://example.com/capture1.jpg",
    "confidence_score": 0.92,
    "vehicle_type": "Car",
    "owner_name": "John Doe",
    "verification_status": "Resident"
}

response = requests.post(url, json=data)
result = response.json()

if result.get('success'):
    print(f"Detection logged: {result['detection']['id']}")
    if result['is_resident']:
        print(f"Resident vehicle: {result['resident_info']['owner_name']}")
else:
    print(f"Error: {result.get('error')}")
```

### cURL
```bash
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/submit-detection \
  -H "Content-Type: application/json" \
  -d '{
    "plate_number": "ABC1234",
    "image_url": "https://example.com/capture1.jpg",
    "confidence_score": 0.92,
    "vehicle_type": "Car",
    "owner_name": "John Doe",
    "verification_status": "Resident"
  }'
```

## Data Flow

1. Flask backend detects vehicle and extracts plate number via OCR
2. Flask queries excise website for owner information
3. Flask submits detection data to this API endpoint
4. API checks if vehicle is registered as resident
5. API stores detection in database and creates access log
6. API returns response with detection details and resident status
7. Dashboard updates in real-time via WebSocket subscription

## Real-time Updates

The dashboard automatically receives real-time updates when new detections are submitted. No additional API calls are needed for the dashboard to refresh.

## Rate Limiting

There are no explicit rate limits on the detection endpoint, but please implement reasonable throttling in your Flask backend to avoid overloading the system.

## Support

For issues or questions, check the application logs or contact your system administrator.
