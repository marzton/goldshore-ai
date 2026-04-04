# Homepage Analytics Events

Track homepage CTA interactions with the following event names.

## Event Catalog

| Event name | Trigger | Source route | Destination |
| --- | --- | --- | --- |
| `homepage_cta_primary_click` | Hero primary CTA click | `/` | `/contact` |
| `homepage_cta_secondary_click` | Hero secondary CTA click | `/` | `/services` |
| `homepage_cta_bottom_click` | Bottom CTA click | `/` | `/contact` |

## Required Event Properties

All homepage CTA click events should include:

- `event_name`
- `route` (expected: `/`)
- `cta_label`
- `cta_href`
- `cta_variant` (`primary`, `secondary`, or `bottom`)
- `timestamp`
