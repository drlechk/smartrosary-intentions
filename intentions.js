window.SMARTROSARY_INTENTIONS = window.SMARTROSARY_INTENTIONS ?? {};
window.registerSmartRosaryIntentions = (fixture) => {
  if (!fixture || typeof fixture !== "object" || !fixture.code) return;
  window.SMARTROSARY_INTENTIONS[fixture.code] = fixture;
};
