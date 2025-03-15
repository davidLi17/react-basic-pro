import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import MonacoEditor from '@monaco-editor/react';
import { PlayCircle, PauseCircle, RotateCcw } from 'lucide-react';
const VisualizerDisplay = ({ taskQueue, microTaskQueue, macroTaskQueue, consoleOutput }) => {
    return (
        <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">同步任务 (执行栈)</h3>
                <div className="border-2 border-blue-500 p-4 min-h-48 rounded-lg">
                    {taskQueue.map((task, index) => (
                        <div key={index} className="bg-blue-200 p-2 rounded mb-2">
                            {task.content}
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">微任务队列 (Microtask Queue)</h3>
                <div className="border-2 border-green-500 p-4 min-h-48 rounded-lg">
                    {microTaskQueue.map((task, index) => (
                        <div key={index} className="bg-green-200 p-2 rounded mb-2">
                            {task.content}
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg border-red-400 font-semibold">宏任务队列 (Macrotask Queue)</h3>
                <div className="border-2 border-red-500 p-4 min-h-48 rounded-lg">
                    {macroTaskQueue.map((task, index) => (
                        <div key={index} className="bg-red-100 p-2 rounded mb-2">
                            {task.content}
                        </div>
                    ))}
                </div>
            </div>

            <div className="col-span-3 mt-8">
                <h3 className="text-lg font-semibold mb-4">控制台输出</h3>
                <div className="bg-gray-900 text-white p-4 rounded-lg min-h-48">
                    {consoleOutput.map((output, index) => (
                        <div
                            key={index}
                            className={`font-mono ${output.type === 'error' ? 'text-red-400' : 'text-green-400'}`}
                        >
                            {`> ${output.content}`}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default VisualizerDisplay;