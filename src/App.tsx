/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { InkDropGame } from './components/InkDropGame';

export default function App() {
  return (
    <div className="w-screen h-screen bg-neutral-900 flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      <InkDropGame />
    </div>
  );
}

