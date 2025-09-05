import {Holistic, POSE_LANDMARKS, POSE_CONNECTIONS, HAND_CONNECTIONS, POSE_LANDMARKS_LEFT, POSE_LANDMARKS_RIGHT} from 'https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/holistic.js';
import {Camera} from 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js';
import {drawConnectors, drawLandmarks, lerp} from 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js';

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
const loadingElement = document.getElementsByClassName('loading')[0];

function onResults(results) {
    loadingElement.style.display = 'none';
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Draw pose connections
    if (results.poseLandmarks) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: 'white'});
        drawLandmarks(
            canvasCtx,
            Object.values(POSE_LANDMARKS_LEFT).map(index => results.poseLandmarks[index]),
            {visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)'}
        );
        drawLandmarks(
            canvasCtx,
            Object.values(POSE_LANDMARKS_RIGHT).map(index => results.poseLandmarks[index]),
            {visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)'}
        );
    }

    // Draw hand connections
    if (results.rightHandLandmarks) {
        drawConnectors(canvasCtx, results.rightHandLandmarks, HAND_CONNECTIONS, {color: 'white'});
        drawLandmarks(canvasCtx, results.rightHandLandmarks, {
            color: 'white',
            fillColor: 'rgb(0,217,231)',
            lineWidth: 2,
            radius: (data) => lerp(data.from.z, -0.15, 0.1, 10, 1)
        });
    }
    if (results.leftHandLandmarks) {
        drawConnectors(canvasCtx, results.leftHandLandmarks, HAND_CONNECTIONS, {color: 'white'});
        drawLandmarks(canvasCtx, results.leftHandLandmarks, {
            color: 'white',
            fillColor: 'rgb(255,138,0)',
            lineWidth: 2,
            radius: (data) => lerp(data.from.z, -0.15, 0.1, 10, 1)
        });
    }

    // Draw face landmarks
    if (results.faceLandmarks) {
        drawConnectors(canvasCtx, results.faceLandmarks, null, {color: 'white'});
    }

    canvasCtx.restore();
}

const holistic = new Holistic({
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic@0.5/${file}`;
    }
});
holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
holistic.onResults(onResults);

// Adjust canvas size for mobile
function resizeCanvas() {
    const aspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    if (maxWidth / aspectRatio <= maxHeight) {
        canvasElement.width = maxWidth;
        canvasElement.height = maxWidth / aspectRatio;
    } else {
        canvasElement.width = maxHeight * aspectRatio;
        canvasElement.height = maxHeight;
    }
}

const camera = new Camera(videoElement, {
    onFrame: async () => {
        await holistic.send({image: videoElement});
    },
    width: 1280,
    height: 720
});
camera.start();

// Handle window resize for mobile responsiveness
window.addEventListener('resize', resizeCanvas);
videoElement.addEventListener('loadedmetadata', resizeCanvas);