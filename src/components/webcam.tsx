import React from 'react';
import Webcam, { WebcamProps } from 'react-webcam';

const videoConstraints = {
  width: 720,
  height: 720,
  facingMode: "user"
};

interface WebcamCaptureProps {
  onCapture: (imageSrc: string) => void;
}

export const WebcamCapture = (props: WebcamCaptureProps) => {
  const webcamRef = React.useRef<Webcam>(null);

  const capture = React.useCallback(
    () => {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!!imageSrc)
        props.onCapture(imageSrc);
    },
    [webcamRef, props]
  );

  return (
    <>
      <Webcam
        audio={false}
        height={videoConstraints.height}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={videoConstraints.width}
        videoConstraints={videoConstraints}
      />
      <button onClick={capture}>Capture photo</button>
    </>
  );
};