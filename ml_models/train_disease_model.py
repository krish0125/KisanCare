"""
backend/ml_models/train_disease_model.py
-----------------------------------------
Script to train a plant disease classifier using transfer learning on MobileNetV2.

DATASET REQUIREMENTS:
This script requires the PlantVillage dataset (approx. 54,000 images, 38 classes).
Due to its large size (~1.5GB), it is not included in the repository.

To download the dataset before running this script:
1. Go to Kaggle (or use Kaggle CLI): 
   kaggle datasets download -d abdallahalidev/plantvillage-dataset
2. Extract the archive into:
   ml_models/data/plantvillage/
3. Inside `plantvillage/`, there should be folders for each class (e.g., 'Tomato___Bacterial_spot').

Once the data is downloaded and extracted, run this script.
"""

import os
import json
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model

# Configuration
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data', 'plantvillage')
MODEL_SAVE_PATH = os.path.join(os.path.dirname(__file__), 'disease_model.h5')
CLASSES_SAVE_PATH = os.path.join(os.path.dirname(__file__), 'disease_classes.json')

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

def main():
    if not os.path.exists(DATA_DIR):
        print(f"Error: Dataset directory not found at {DATA_DIR}")
        print("Please download and extract the PlantVillage dataset there.")
        return

    # 1. Data Preparation with Augmentation
    print("Preparing data generators...")
    datagen = ImageDataGenerator(
        rescale=1./255,
        validation_split=0.2, # 80/20 split
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True
    )

    train_generator = datagen.flow_from_directory(
        DATA_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    val_generator = datagen.flow_from_directory(
        DATA_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )
    
    num_classes = train_generator.num_classes
    print(f"Found {num_classes} classes.")

    # Save class indices
    class_indices = {v: k for k, v in train_generator.class_indices.items()}
    with open(CLASSES_SAVE_PATH, 'w') as f:
        json.dump(class_indices, f)
    print(f"Saved class mappings to {CLASSES_SAVE_PATH}")

    # 2. Build Model (Transfer Learning with MobileNetV2)
    print("Building model...")
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
    
    # Freeze the base model
    base_model.trainable = False

    # Add custom head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    # 3. Train Model
    print("Starting training...")
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=val_generator
    )

    # 4. Evaluate and Save
    val_loss, val_accuracy = model.evaluate(val_generator)
    print(f"\nFinal Validation Accuracy: {val_accuracy * 100:.2f}%")
    
    model.save(MODEL_SAVE_PATH)
    print(f"Model saved to {MODEL_SAVE_PATH}")

if __name__ == '__main__':
    main()
