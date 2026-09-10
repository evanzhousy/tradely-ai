# Platform feature widget references

The landing bento adapts visual ideas from these Animata widgets:

- [Weekly Progress](https://animata.design/docs/widget/weekly-progress): compact checkpoint rings and percentage.
- [Notes](https://animata.design/docs/widget/notes): a warm paper note for concise AI feedback.
- [Reminder Widget](https://animata.design/docs/widget/reminder-widget): an interactive list with a remaining-item count.

These are Tradely implementations using the existing CircularProgress and Button components, native checkboxes, and bilingual copy. No Animata package or runtime dependency is added.

`LandingPlatformFeatures` owns a single illustrative checklist state. Both the rings and percentage derive from that state; the public demo never writes account progress, grades an answer, or calls the AI service. Reset restores the same initial example. Locale changes preserve the selected items. The AI note retains its example and pilot labels.

The widgets expand with content rather than using the references' fixed dimensions or internal scroll areas. Progress transitions only run when reduced motion is not requested. Existing guided-learning and language cards keep their behavior.
