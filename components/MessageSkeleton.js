import React from 'react';

const MessageSkeleton = () => (
    <div className="flex flex-col gap-4 w-full animate-pulse">
        {/* Right aligned message skeleton */}
        <div className="flex justify-end mb-4">
            <div className="flex flex-col items-end max-w-[80%]">
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-48 bg-gray-200 rounded"></div>
            </div>
        </div>

        {/* Left aligned message skeleton */}
        <div className="flex justify-start mb-4">
            <div className="flex flex-col items-start max-w-[80%]">
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-64 bg-gray-200 rounded"></div>
            </div>
        </div>

        {/* Right aligned message skeleton */}
        <div className="flex justify-end mb-4">
            <div className="flex flex-col items-end max-w-[80%]">
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-56 bg-gray-200 rounded"></div>
            </div>
        </div>

        <div className="flex justify-start mb-4">
            <div className="flex flex-col items-start max-w-[80%]">
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-64 bg-gray-200 rounded"></div>
            </div>
        </div>

        {/* Right aligned message skeleton */}
        <div className="flex justify-end mb-4">
            <div className="flex flex-col items-end max-w-[80%]">
                <div className="h-4 w-24 bg-gray-200 rounded mb-1"></div>
                <div className="h-10 w-56 bg-gray-200 rounded"></div>
            </div>
        </div>


    </div>


);

export default MessageSkeleton;