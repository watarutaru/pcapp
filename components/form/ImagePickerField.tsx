import { useState, useRef, createElement } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Platform, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/colors';

interface Props {
  uri: string | null;
  onImageSelected: (uri: string, mimeType?: string) => void;
  placeholder?: string;
  height?: number;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  quality?: number;
}

export default function ImagePickerField({
  uri,
  onImageSelected,
  placeholder = '📷 画像を選択',
  height = 160,
  resizeMode = 'cover',
  quality = 0.9,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<any>(null);

  function handleFile(file: File) {
    const objectUrl = URL.createObjectURL(file);
    onImageSelected(objectUrl, file.type);
  }

  async function pickNative() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限エラー', 'カメラロールへのアクセスを許可してください');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality,
    });
    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri, result.assets[0].mimeType ?? undefined);
    }
  }

  if (Platform.OS === 'web') {
    const pickerStyle = [
      styles.picker,
      { height },
      isDragging && styles.pickerDragging,
      { cursor: 'pointer' } as any,
    ];

    return (
      <View>
        <View
          style={pickerStyle}
          {...{
            onDragOver: (e: any) => { e.preventDefault(); setIsDragging(true); },
            onDragLeave: (e: any) => { e.preventDefault(); setIsDragging(false); },
            onDrop: (e: any) => {
              e.preventDefault();
              setIsDragging(false);
              const file: File | undefined = e.dataTransfer?.files?.[0];
              if (file?.type.startsWith('image/')) handleFile(file);
            },
            onClick: () => inputRef.current?.click(),
          } as any}
        >
          {uri ? (
            <Image source={{ uri }} style={styles.preview} resizeMode={resizeMode} />
          ) : (
            <View style={styles.placeholderBox}>
              <Text style={styles.placeholderText}>
                {isDragging ? 'ここにドロップ' : placeholder}
              </Text>
              <Text style={styles.subText}>またはクリックして選択</Text>
            </View>
          )}
        </View>
        {createElement('input', {
          ref: inputRef,
          type: 'file',
          accept: 'image/*',
          style: { display: 'none' },
          onChange: (e: any) => {
            const file: File | undefined = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          },
        })}
        {uri && (
          <TouchableOpacity style={styles.changeBtn} onPress={() => inputRef.current?.click()}>
            <Text style={styles.changeBtnText}>画像を変更</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[styles.picker, { height }]}
        onPress={pickNative}
        activeOpacity={0.7}
      >
        {uri ? (
          <Image source={{ uri }} style={styles.preview} resizeMode={resizeMode} />
        ) : (
          <Text style={styles.placeholderText}>{placeholder}</Text>
        )}
      </TouchableOpacity>
      {uri && (
        <TouchableOpacity style={styles.changeBtn} onPress={pickNative}>
          <Text style={styles.changeBtnText}>画像を変更</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerDragging: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '11',
  },
  placeholderBox: {
    alignItems: 'center',
    gap: 4,
  },
  placeholderText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  subText: {
    color: Colors.textSecondary,
    fontSize: 12,
    opacity: 0.7,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  changeBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  changeBtnText: {
    color: Colors.primary,
    fontSize: 13,
  },
});
