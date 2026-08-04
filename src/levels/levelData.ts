import { LevelDefinition } from '../types';

export const HANDCRAFTED_LEVELS: LevelDefinition[] = [
  // LEVEL 1: First Drop
  {
    id: 1,
    title: "First Drop",
    maxInk: 120,
    threeStarInkRatio: 0.65,
    twoStarInkRatio: 0.35,
    ball: { x: 180, y: 120, radius: 14 },
    glass: { x: 280, y: 480, width: 70, height: 80 },
    obstacles: [
      { id: 'w1', type: 'wall', x: 200, y: 300, width: 140, height: 16, rotation: 0.2 }
    ],
    hintPath: [
      { x: 150, y: 180 },
      { x: 240, y: 260 },
      { x: 270, y: 420 }
    ]
  },

  // LEVEL 2: Bridge The Gap
  {
    id: 2,
    title: "Bridge The Gap",
    maxInk: 140,
    threeStarInkRatio: 0.60,
    twoStarInkRatio: 0.30,
    ball: { x: 100, y: 140, radius: 14 },
    glass: { x: 340, y: 460, width: 70, height: 80 },
    obstacles: [
      { id: 'w1', type: 'wall', x: 90, y: 220, width: 120, height: 16 },
      { id: 'w2', type: 'wall', x: 350, y: 320, width: 100, height: 16, rotation: -0.15 }
    ],
    hintPath: [
      { x: 120, y: 220 },
      { x: 260, y: 280 },
      { x: 330, y: 400 }
    ]
  },

  // LEVEL 3: Obstacle Dodge
  {
    id: 3,
    title: "Obstacle Dodge",
    maxInk: 150,
    threeStarInkRatio: 0.60,
    twoStarInkRatio: 0.30,
    ball: { x: 200, y: 100, radius: 14 },
    glass: { x: 200, y: 500, width: 70, height: 80 },
    obstacles: [
      { id: 'w1', type: 'wall', x: 200, y: 280, width: 160, height: 20 },
      { id: 's1', type: 'spike', x: 200, y: 260, width: 140, height: 12 }
    ],
    hintPath: [
      { x: 140, y: 150 },
      { x: 90, y: 300 },
      { x: 180, y: 440 }
    ]
  },

  // LEVEL 4: Funnel Ramp
  {
    id: 4,
    title: "Funnel Ramp",
    maxInk: 160,
    threeStarInkRatio: 0.55,
    twoStarInkRatio: 0.25,
    ball: { x: 320, y: 110, radius: 14 },
    glass: { x: 110, y: 480, width: 70, height: 80 },
    obstacles: [
      { id: 'w1', type: 'wall', x: 260, y: 220, width: 180, height: 16, rotation: -0.3 },
      { id: 'w2', type: 'wall', x: 140, y: 360, width: 140, height: 16, rotation: 0.25 }
    ],
    hintPath: [
      { x: 300, y: 180 },
      { x: 180, y: 290 },
      { x: 120, y: 420 }
    ]
  },

  // LEVEL 5: Spinning Wheel
  {
    id: 5,
    title: "Spinning Wheel",
    maxInk: 160,
    threeStarInkRatio: 0.55,
    twoStarInkRatio: 0.25,
    ball: { x: 80, y: 120, radius: 14 },
    glass: { x: 330, y: 480, width: 70, height: 80 },
    obstacles: [
      { id: 'r1', type: 'rotator', x: 210, y: 280, width: 140, height: 16, speed: 1.5 }
    ],
    hintPath: [
      { x: 100, y: 180 },
      { x: 220, y: 200 },
      { x: 330, y: 420 }
    ]
  },

  // LEVEL 6: Moving Platform
  {
    id: 6,
    title: "Moving Platform",
    maxInk: 170,
    threeStarInkRatio: 0.50,
    twoStarInkRatio: 0.25,
    ball: { x: 210, y: 100, radius: 14 },
    glass: { x: 210, y: 500, width: 70, height: 80 },
    obstacles: [
      { id: 'm1', type: 'moving', x: 210, y: 260, width: 120, height: 16, moveDistance: 110, speed: 1.2, moveAxis: 'x' }
    ],
    hintPath: [
      { x: 110, y: 180 },
      { x: 100, y: 340 },
      { x: 200, y: 440 }
    ]
  },

  // LEVEL 7: Portal Leap
  {
    id: 7,
    title: "Portal Leap",
    maxInk: 150,
    threeStarInkRatio: 0.60,
    twoStarInkRatio: 0.30,
    ball: { x: 90, y: 140, radius: 14 },
    glass: { x: 330, y: 480, width: 70, height: 80 },
    obstacles: [
      { id: 'w1', type: 'wall', x: 210, y: 300, width: 220, height: 20 },
      { id: 'p1', type: 'portal', x: 90, y: 280, width: 50, height: 50, targetPortalId: 'p2' },
      { id: 'p2', type: 'portal', x: 330, y: 220, width: 50, height: 50 }
    ],
    hintPath: [
      { x: 70, y: 200 },
      { x: 90, y: 260 }
    ]
  },

  // LEVEL 8: Wind Gust
  {
    id: 8,
    title: "Wind Gust",
    maxInk: 180,
    threeStarInkRatio: 0.50,
    twoStarInkRatio: 0.25,
    ball: { x: 80, y: 140, radius: 14 },
    glass: { x: 340, y: 480, width: 70, height: 80 },
    obstacles: [
      { id: 's1', type: 'spike', x: 210, y: 380, width: 180, height: 16 },
      { id: 'f1', type: 'fan', x: 150, y: 300, width: 80, height: 120, forceDirection: { x: 0.8, y: -0.6 }, forceMagnitude: 0.003 }
    ],
    hintPath: [
      { x: 90, y: 220 },
      { x: 160, y: 280 },
      { x: 330, y: 420 }
    ]
  },

  // LEVEL 9: Gravity Flip
  {
    id: 9,
    title: "Gravity Flip",
    maxInk: 180,
    threeStarInkRatio: 0.50,
    twoStarInkRatio: 0.25,
    ball: { x: 90, y: 420, radius: 14 },
    glass: { x: 320, y: 180, width: 70, height: 80 },
    obstacles: [
      { id: 'g1', type: 'gravityZone', x: 180, y: 320, width: 140, height: 160, gravityScale: { x: 0, y: -1 } }
    ],
    hintPath: [
      { x: 90, y: 440 },
      { x: 180, y: 380 },
      { x: 310, y: 140 }
    ]
  },

  // LEVEL 10: Magnetic Pull
  {
    id: 10,
    title: "Magnetic Pull",
    maxInk: 170,
    threeStarInkRatio: 0.55,
    twoStarInkRatio: 0.25,
    ball: { x: 210, y: 100, radius: 14 },
    glass: { x: 210, y: 500, width: 70, height: 80 },
    obstacles: [
      { id: 'm1', type: 'magnet', x: 310, y: 280, radius: 140, forceMagnitude: 0.003, isRepel: false }
    ],
    hintPath: [
      { x: 160, y: 180 },
      { x: 130, y: 340 },
      { x: 200, y: 440 }
    ]
  },

  // LEVEL 11: Glass Breaker
  {
    id: 11,
    title: "Glass Breaker",
    maxInk: 160,
    threeStarInkRatio: 0.55,
    twoStarInkRatio: 0.25,
    ball: { x: 90, y: 100, radius: 14 },
    glass: { x: 320, y: 480, width: 70, height: 80 },
    obstacles: [
      { id: 'b1', type: 'breakable', x: 210, y: 280, width: 140, height: 20 }
    ],
    hintPath: [
      { x: 80, y: 140 },
      { x: 190, y: 240 },
      { x: 310, y: 420 }
    ]
  },

  // LEVEL 12: Twin Rotators
  {
    id: 12,
    title: "Twin Rotators",
    maxInk: 190,
    threeStarInkRatio: 0.50,
    twoStarInkRatio: 0.25,
    ball: { x: 210, y: 90, radius: 14 },
    glass: { x: 210, y: 510, width: 70, height: 80 },
    obstacles: [
      { id: 'r1', type: 'rotator', x: 120, y: 240, width: 110, height: 16, speed: 1.2 },
      { id: 'r2', type: 'rotator', x: 300, y: 360, width: 110, height: 16, speed: -1.2 }
    ],
    hintPath: [
      { x: 180, y: 160 },
      { x: 220, y: 300 },
      { x: 210, y: 440 }
    ]
  },

  // LEVEL 13: Portal & Fan Combo
  {
    id: 13,
    title: "Portal & Fan",
    maxInk: 180,
    threeStarInkRatio: 0.50,
    twoStarInkRatio: 0.25,
    ball: { x: 80, y: 120, radius: 14 },
    glass: { x: 340, y: 480, width: 70, height: 80 },
    obstacles: [
      { id: 'p1', type: 'portal', x: 80, y: 260, width: 50, height: 50, targetPortalId: 'p2' },
      { id: 'p2', type: 'portal', x: 220, y: 140, width: 50, height: 50 },
      { id: 'f1', type: 'fan', x: 220, y: 240, width: 80, height: 100, forceDirection: { x: 1, y: 0.2 }, forceMagnitude: 0.0025 }
    ],
    hintPath: [
      { x: 70, y: 180 },
      { x: 80, y: 240 }
    ]
  },

  // LEVEL 14: Spike Canyon
  {
    id: 14,
    title: "Spike Canyon",
    maxInk: 200,
    threeStarInkRatio: 0.45,
    twoStarInkRatio: 0.20,
    ball: { x: 210, y: 90, radius: 14 },
    glass: { x: 210, y: 520, width: 70, height: 80 },
    obstacles: [
      { id: 's1', type: 'spike', x: 100, y: 280, width: 120, height: 16, rotation: 0.5 },
      { id: 's2', type: 'spike', x: 320, y: 340, width: 120, height: 16, rotation: -0.5 }
    ],
    hintPath: [
      { x: 170, y: 160 },
      { x: 230, y: 320 },
      { x: 210, y: 460 }
    ]
  },

  // LEVEL 15: Magnetic Slalom
  {
    id: 15,
    title: "Magnetic Slalom",
    maxInk: 190,
    threeStarInkRatio: 0.50,
    twoStarInkRatio: 0.25,
    ball: { x: 80, y: 110, radius: 14 },
    glass: { x: 340, y: 490, width: 70, height: 80 },
    obstacles: [
      { id: 'm1', type: 'magnet', x: 160, y: 240, radius: 120, forceMagnitude: 0.0025, isRepel: true },
      { id: 'm2', type: 'magnet', x: 280, y: 360, radius: 120, forceMagnitude: 0.0025, isRepel: false }
    ],
    hintPath: [
      { x: 90, y: 180 },
      { x: 220, y: 280 },
      { x: 330, y: 430 }
    ]
  },

  // LEVEL 16: Zero Gravity Bounce
  {
    id: 16,
    title: "Zero Gravity Bounce",
    maxInk: 200,
    threeStarInkRatio: 0.45,
    twoStarInkRatio: 0.20,
    ball: { x: 90, y: 440, radius: 14 },
    glass: { x: 330, y: 480, width: 70, height: 80 },
    obstacles: [
      { id: 'g1', type: 'gravityZone', x: 180, y: 340, width: 160, height: 180, gravityScale: { x: 0.2, y: -0.8 } },
      { id: 'w1', type: 'wall', x: 210, y: 120, width: 180, height: 16, rotation: 0.2 }
    ],
    hintPath: [
      { x: 90, y: 460 },
      { x: 180, y: 240 },
      { x: 320, y: 420 }
    ]
  },

  // LEVEL 17: The Seesaw
  {
    id: 17,
    title: "The Seesaw",
    maxInk: 180,
    threeStarInkRatio: 0.50,
    twoStarInkRatio: 0.25,
    ball: { x: 330, y: 100, radius: 14 },
    glass: { x: 90, y: 500, width: 70, height: 80 },
    obstacles: [
      { id: 'r1', type: 'rotator', x: 210, y: 300, width: 180, height: 16, speed: -0.8 }
    ],
    hintPath: [
      { x: 310, y: 160 },
      { x: 190, y: 280 },
      { x: 100, y: 440 }
    ]
  },

  // LEVEL 18: Breakable Fortress
  {
    id: 18,
    title: "Breakable Fortress",
    maxInk: 210,
    threeStarInkRatio: 0.45,
    twoStarInkRatio: 0.20,
    ball: { x: 210, y: 90, radius: 14 },
    glass: { x: 210, y: 520, width: 70, height: 80 },
    obstacles: [
      { id: 'b1', type: 'breakable', x: 210, y: 240, width: 160, height: 18 },
      { id: 's1', type: 'spike', x: 210, y: 360, width: 120, height: 16 }
    ],
    hintPath: [
      { x: 120, y: 140 },
      { x: 110, y: 320 },
      { x: 200, y: 450 }
    ]
  },

  // LEVEL 19: The Cauldron
  {
    id: 19,
    title: "The Cauldron",
    maxInk: 220,
    threeStarInkRatio: 0.40,
    twoStarInkRatio: 0.20,
    ball: { x: 80, y: 100, radius: 14 },
    glass: { x: 330, y: 490, width: 70, height: 80 },
    obstacles: [
      { id: 'f1', type: 'fan', x: 180, y: 280, width: 90, height: 100, forceDirection: { x: 1, y: -0.5 }, forceMagnitude: 0.003 },
      { id: 's1', type: 'spike', x: 330, y: 340, width: 100, height: 16 }
    ],
    hintPath: [
      { x: 80, y: 180 },
      { x: 170, y: 260 },
      { x: 320, y: 420 }
    ]
  },

  // LEVEL 20: Master Builder
  {
    id: 20,
    title: "Master Builder",
    maxInk: 240,
    threeStarInkRatio: 0.40,
    twoStarInkRatio: 0.20,
    ball: { x: 210, y: 80, radius: 14 },
    glass: { x: 210, y: 530, width: 70, height: 80 },
    obstacles: [
      { id: 'r1', type: 'rotator', x: 110, y: 220, width: 100, height: 16, speed: 1.5 },
      { id: 'p1', type: 'portal', x: 320, y: 220, width: 50, height: 50, targetPortalId: 'p2' },
      { id: 'p2', type: 'portal', x: 90, y: 380, width: 50, height: 50 },
      { id: 's1', type: 'spike', x: 210, y: 340, width: 140, height: 16 }
    ],
    hintPath: [
      { x: 190, y: 120 },
      { x: 300, y: 200 }
    ]
  }
];
