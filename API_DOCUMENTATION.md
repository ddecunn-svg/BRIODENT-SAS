# API Documentation

## Overview
This API documentation provides a complete reference for the BRIODENT-SAS application. Each endpoint is described with details about the request and response formats as well as examples where applicable.

## Base URL
The base URL for accessing the API is: `https://api.briodent-sas.com/v1`

## Authentication
Most of the API endpoints require authentication via API keys or OAuth tokens. Ensure your token is included in the header of your requests.

## Endpoints

### 1. User Authentication
- **Endpoint:** `/auth/login`
- **Method:** POST
- **Request Body:**
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **Response:**
  - 200 OK
  - 401 Unauthorized

### 2. Get User Profile
- **Endpoint:** `/user/profile`
- **Method:** GET
- **Headers:**
  - `Authorization: Bearer {token}`
- **Response:**
  - 200 OK
  ```json
  {
    "id": "string",
    "username": "string",
    "email": "string"
  }
  ```

### 3. Update User Profile
- **Endpoint:** `/user/profile`
- **Method:** PUT
- **Headers:**
  - `Authorization: Bearer {token}`
- **Request Body:**
  ```json
  {
    "email": "string"
  }
  ```
- **Response:**
  - 200 OK

### 4. Fetch Data
- **Endpoint:** `/data/fetch`
- **Method:** GET
- **Query Parameters:**
  - `filter`: optional
- **Response:**
  - 200 OK
  ```json
  [
    {
      "id": "string",
      "value": "number"
    }
  ]
  ```

### 5. Submit Data
- **Endpoint:** `/data/submit`
- **Method:** POST
- **Headers:**
  - `Authorization: Bearer {token}`
- **Request Body:**
  ```json
  {
    "data": "string"
  }
  ```
- **Response:**
  - 201 Created

## Errors
Common error codes returned by the API:
- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

## Conclusion
This document serves as the complete API reference for the BRIODENT-SAS application. For further assistance, refer to the support team or consult the development documentation.