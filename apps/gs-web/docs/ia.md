# GS Web Information Architecture (Single Source of Truth)

This document is the canonical sitemap and conversion mapping for core public routes in `gs-web`.

## Route sitemap

| Route | Primary user intent | Primary CTA | Secondary CTA | Success event name (analytics) |
| --- | --- | --- | --- | --- |
| `/` | Quickly understand Goldshore's value proposition and start a high-intent action. | `Get Started` | `Explore Services` | `home_primary_cta_clicked` |
| `/about` | Validate credibility, team background, and mission fit before engaging. | `Contact Us` | `View Services` | `about_primary_cta_clicked` |
| `/services` | Evaluate service offerings and choose the right entry point. | `Request Consultation` | `Contact Sales` | `services_primary_cta_clicked` |
| `/contact` | Submit an inquiry and start a direct conversation. | `Submit Contact Form` | `View Services` | `contact_form_submitted` |
| `/thank-you` | Confirm submission success and continue to a meaningful next step. | `Back to Home` | `Explore Services` | `thank_you_continue_clicked` |

## CTA matrix

Each CTA below maps to exactly one conversion event and one destination route.

| Source route | Button/link label | Conversion event | Destination route |
| --- | --- | --- | --- |
| `/` | `Get Started` | `home_primary_cta_clicked` | `/contact` |
| `/` | `Explore Services` | `home_secondary_cta_clicked` | `/services` |
| `/about` | `Contact Us` | `about_primary_cta_clicked` | `/contact` |
| `/about` | `View Services` | `about_secondary_cta_clicked` | `/services` |
| `/services` | `Request Consultation` | `services_primary_cta_clicked` | `/contact` |
| `/services` | `Contact Sales` | `services_secondary_cta_clicked` | `/contact` |
| `/contact` | `Submit Contact Form` | `contact_form_submitted` | `/thank-you` |
| `/contact` | `View Services` | `contact_secondary_cta_clicked` | `/services` |
| `/thank-you` | `Back to Home` | `thank_you_primary_cta_clicked` | `/` |
| `/thank-you` | `Explore Services` | `thank_you_secondary_cta_clicked` | `/services` |
