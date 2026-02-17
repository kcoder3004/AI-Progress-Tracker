import React, { useState, useRef, useEffect } from "react";
import { View, Text, Button, Image, StyleSheet, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, Modal, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [photo, setPhoto] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // App State
  const [students, setStudents] = useState(["Default"]);
  const [isNewStudentModal, setIsNewStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");

  // Form State
  const [selectedStudent, setSelectedStudent] = useState("Default");
  const [category, setCategory] = useState("BTM"); 
  const [level, setLevel] = useState("");
  const [book, setBook] = useState("");
  const [errors, setErrors] = useState("");
  const [date, setDate] = useState(new Date().toLocaleDateString());

  useEffect(() => { loadStudents(); }, []);

  const loadStudents = async () => {
    const saved = await AsyncStorage.getItem('student_list');
    if (saved) setStudents(JSON.parse(saved));
  };

  const handleAddStudent = async () => {
    if (!newStudentName.trim()) return;
    const newList = [...students, newStudentName.trim()];
    setStudents(newList);
    await AsyncStorage.setItem('student_list', JSON.stringify(newList));
    setSelectedStudent(newStudentName.trim());
    setNewStudentName("");
    setIsNewStudentModal(false);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      // Capture with base64 enabled for the AI
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: true
      });
      setPhoto(result);
    }
  };

  const analyzeWithAI = async () => {
    if (!photo?.base64) {
      Alert.alert("Error", "No image data found.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('https://ai-progress-tracker.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photo.base64 }),
      });

      const data = await response.json();

      if (data.extracted) {
        if (data.extracted.level) setLevel(data.extracted.level);
        if (data.extracted.book) setBook(data.extracted.book);
        Alert.alert("AI Analysis Complete", "We found some details! Please check the Level and Book fields.");
      } else {
        Alert.alert("AI Notice", "Text found but couldn't identify specific Level/Book. Try a clearer photo.");
      }
    } catch (e) {
      Alert.alert("Brain Offline", "The server is likely waking up. Wait 20 seconds and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToHistory = async () => {
    if (!level || !book || !errors) {
      Alert.alert("Missing Info", "Please fill Level, Book, and Errors.");
      return;
    }

    try {
      const newEntry = {
        id: Date.now().toString(),
        value: parseInt(errors),
        label: `L${level}-B${book}`,
        date,
        category,
      };

      const storageKey = `data_${selectedStudent}_${category}`;
      const existingData = await AsyncStorage.getItem(storageKey);
      const history = existingData ? JSON.parse(existingData) : [];
      history.push(newEntry);
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(history));
      Alert.alert("Saved", `Entry for ${selectedStudent} successful!`);
      setPhoto(null); setLevel(""); setBook(""); setErrors("");
    } catch (e) {
      Alert.alert("Error", "Save failed.");
    }
  };

  if (!permission?.granted) return <View style={styles.center}><Button title="Enable Camera" onPress={requestPermission} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <Modal visible={isNewStudentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Student</Text>
            <TextInput style={styles.input} placeholder="Enter Name" value={newStudentName} onChangeText={setNewStudentName} autoFocus />
            <View style={styles.buttonRow}>
              <Button title="Cancel" onPress={() => setIsNewStudentModal(false)} color="red" />
              <Button title="Add" onPress={handleAddStudent} />
            </View>
          </View>
        </View>
      </Modal>

      {!photo ? (
        <View style={{flex: 1}}>
          <CameraView style={styles.camera} facing="back" ref={cameraRef} />
          <View style={styles.controls}>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
               <View style={styles.innerCircle} />
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.center}>
          <Image source={{ uri: photo.uri }} style={styles.preview} />
          
          <View style={styles.form}>
            <TouchableOpacity 
              style={[styles.aiButton, isAnalyzing && {backgroundColor: '#ccc'}]} 
              onPress={analyzeWithAI}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? <ActivityIndicator color="white" /> : <Text style={styles.aiButtonText}>🪄 Scan with AI</Text>}
            </TouchableOpacity>

            <Text style={styles.label}>Student & Subject:</Text>
            <View style={styles.pickerRow}>
              <Picker style={{flex: 1}} selectedValue={selectedStudent} onValueChange={setSelectedStudent}>
                {students.map(s => <Picker.Item key={s} label={s} value={s} />)}
              </Picker>
              <TouchableOpacity style={styles.plusBtn} onPress={() => setIsNewStudentModal(true)}>
                <Text style={{color: 'white', fontWeight: 'bold'}}>+</Text>
              </TouchableOpacity>
            </View>

            <Picker selectedValue={category} onValueChange={setCategory}>
              <Picker.Item label="Basic Thinking Math (BTM)" value="BTM" />
              <Picker.Item label="Critical Thinking Math (CTM)" value="CTM" />
              <Picker.Item label="English" value="English" />
            </Picker>

            <TextInput style={styles.input} placeholder="Date" value={date} onChangeText={setDate} />
            <TextInput style={styles.input} placeholder="Level" value={level} onChangeText={setLevel} />
            <TextInput style={styles.input} placeholder="Book #" keyboardType="numeric" value={book} onChangeText={setBook} />
            <TextInput style={styles.input} placeholder="Errors" keyboardType="numeric" value={errors} onChangeText={setErrors} />
            
            <View style={{marginTop: 10, gap: 10}}>
                <Button title="Save Entry" onPress={saveToHistory} color="green" />
                <Button title="Retake Photo" onPress={() => setPhoto(null)} color="red" />
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  camera: { flex: 1 },
  center: { padding: 20, paddingBottom: 50 },
  preview: { width: '100%', height: 250, borderRadius: 10, marginBottom: 10 },
  controls: { position: 'absolute', bottom: 30, width: '100%', alignItems: 'center' },
  captureBtn: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: 'white' },
  innerCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'white' },
  form: { width: '100%', gap: 8 },
  label: { fontWeight: 'bold', fontSize: 16, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, backgroundColor: '#fafafa' },
  pickerRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eee', borderRadius: 8 },
  plusBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, marginLeft: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  aiButton: { backgroundColor: '#5856D6', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  aiButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});