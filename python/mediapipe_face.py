# https://ai.google.dev/edge/mediapipe/solutions/vision/face_detector/python
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import sys

BaseOptions = mp.tasks.BaseOptions
FaceDetector = mp.tasks.vision.FaceDetector
FaceDetectorOptions = mp.tasks.vision.FaceDetectorOptions
VisionRunningMode = mp.tasks.vision.RunningMode

MODEL_PATH = "./python/modelData/blaze_face_short_range.tflite"

options = FaceDetectorOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.IMAGE,
    min_detection_confidence=0.5,
)

filepath = ' '.join(sys.argv[1:])
mp_image = mp.Image.create_from_file(f'{filepath}')

import mediapipe as mp
with FaceDetector.create_from_options(options) as detector:
    face_detector_result = detector.detect(mp_image)
    print(len(face_detector_result.detections))
