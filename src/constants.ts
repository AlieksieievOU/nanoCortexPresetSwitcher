export const CC = {
    EXPRESSION: 1,
    GATE: 34,
    CAPTURE: 35,
    CAB: 36,
    FX1: 37,
    FX2: 38,
    FX3: 39,
    FX4: 40,
    FX5: 41,
    TAP: 42,
    TUNER: 43
} as const;

export const DEFAULT_CC_STATE = {
    [CC.GATE]: false,
    [CC.CAPTURE]: false,
    [CC.CAB]: false,
    [CC.FX1]: false,
    [CC.FX2]: false,
    [CC.FX3]: false,
    [CC.FX4]: false,
    [CC.FX5]: false,
    [CC.TUNER]: false
};
