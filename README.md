# IoT-Based Urban Air Quality Monitoring and Forecasting System

## Project Overview

This project implements an IoT-enabled system for real-time urban air quality monitoring and short-term forecasting using a distributed 5×5 grid of low-cost environmental sensors. The system combines hardware sensing (ESP32-based nodes), cloud storage (ThingSpeak), advanced spatio-temporal forecasting with a hybrid CNN–LSTM model, and an interactive web dashboard for visualization and alerts.

The primary goal is to provide accessible, high-resolution spatial and temporal air quality data to support public awareness, research, and decision-making in polluted urban areas (with a focus on cities like Hanoi, Vietnam).

### Key Features
- **Distributed Sensing Network**: 25 sensor nodes arranged in a 5×5 grid for spatial coverage.
- **Sensors**:
  - DHT11: Temperature and humidity
  - MQ-2: Combustible gases (e.g., LPG, smoke)
  - MQ-7: Carbon monoxide (CO)
  - GP2Y1010AU0F: PM2.5 particulate matter
- **Data Transmission**: ESP32 microcontrollers collect, calibrate, and upload data via Wi-Fi (HTTP/MQTT) to ThingSpeak.
- **Data Preprocessing**: Timestamp alignment, missing value interpolation, and feature scaling.
- **AI Forecasting**: Hybrid CNN–LSTM model for multi-variable, multi-sensor spatio-temporal prediction (3 past timesteps → next timestep).
- **Interactive Dashboard**: Heatmaps, time-series plots, historical filtering, prediction overlays, and alert indicators.
- **Performance**: Normalized RMSE ≈ 0.1043 (promising initial results).

## Motivation

Air pollution is a major public health crisis. In Vietnam:
- Ranked 22nd globally and 2nd in ASEAN (IQAir 2023)
- Hanoi frequently among the world's most polluted cities (PM2.5 ~6× WHO guideline)
- ~60,000–70,000 premature deaths annually
- Economic loss: $11–13 billion/year (~4–5% GDP)

This project aims to contribute affordable, scalable monitoring tools to support better urban air quality management.

## Repository Structure
