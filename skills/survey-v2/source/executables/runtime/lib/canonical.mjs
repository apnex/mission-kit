// Compatibility boundary for the recovered Survey-v2 runtime. The sovereign
// implementation now lives with the neutral authoring kernel, while every
// historical import keeps the same exported function identity and behavior.
export * from "../../../authoring/kernel/canonical.mjs";
