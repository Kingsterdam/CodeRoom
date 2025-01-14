import { useEffect, useState } from 'react';

const Loader = () => {
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    // Start completion animation after initial loading animation
    const timer = setTimeout(() => {
      setIsComplete(true);
    }, 2000); // Adjust this timing to match when you want the fast completion to start

    // Remove the component after completion
    const cleanup = setTimeout(() => {
      // You can call your unmount function here if needed
    }, 2300); // Total time: 2000ms + 300ms for completion animation

    return () => {
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, []);

  return (
    <div className="line-loader">
      <div className={`line ${isComplete ? 'complete' : ''}`} />
    </div>
  );
};

export default Loader;