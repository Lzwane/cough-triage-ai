# Cough Scout

Build a responsive, modern web application for "Cough Afrika", an AI-powered multi-modal tuberculosis (TB) screening platform designed for low-resource communities and clinical triage.

The app should feature a clean, accessible mobile-first medical dashboard with the following core modules:

1. Interactive Symptom Questionnaire (Tabular Screening):

   - A multi-step form capturing patient demographics (Age) and core symptoms: Fever, Unintentional Weight Loss, Night Sweats, Cough Duration, and Red Flag symptoms (Coughing Blood / Hemoptysis).

   - Real-time calculation of a Constitutional Symptom Score and Total Symptom Burden.

2. Audio Cough Recording & Upload Module:

   - An interactive voice recorder component allowing users to record a 3-second cough audio clip directly in the browser or upload a pre-recorded .wav file.

   - Live waveform visualization placeholder while recording.

3. Multi-Modal AI Risk Assessment & Dashboard:

   - A backend connection handler that transmits tabular data and audio files to our FastAPI inference endpoint (/api/v1/screen).

   - A dynamic risk meter showing the final combined risk score (60% Tabular Clinical + 40% Audio Acoustic).

   - Clear visual triage tiers: 

     * High Risk (>= 50%): Displays urgent referral warnings urging confirmatory GeneXpert MTB/RIF sputum testing at the nearest clinic.

     * Low Risk (< 50%): Displays reassurance messages and general respiratory monitoring advice.

4. UI/UX Style:

   - Clean healthcare aesthetic using medical teal (#008080), slate blue, and alert crimson highlights.

   - Fully optimized for mobile screens (simulating a WhatsApp-style or progressive web app experience) with clear loading states and tooltips explaining why metrics like Recall/Sensitivity matter for early disease detection.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cough-triage-ai.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ec364ecf-54bb-4229-9633-2fa9cffbba74).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
