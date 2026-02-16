import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { LineChart } from "react-native-gifted-charts";
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

export default function ChartScreen() {
  const [selectedStudent, setSelectedStudent] = useState("Default");
  const [students, setStudents] = useState(["Default"]);
  const [dataBTM, setDataBTM] = useState<any[]>([]);
  const [dataCTM, setDataCTM] = useState<any[]>([]);
  const [dataENG, setDataENG] = useState<any[]>([]);
  const isFocused = useIsFocused();

  const loadAll = async () => {
    const sList = await AsyncStorage.getItem('student_list');
    if (sList) setStudents(JSON.parse(sList));

    const btm = await AsyncStorage.getItem(`data_${selectedStudent}_BTM`);
    const ctm = await AsyncStorage.getItem(`data_${selectedStudent}_CTM`);
    const eng = await AsyncStorage.getItem(`data_${selectedStudent}_English`);

    setDataBTM(btm ? JSON.parse(btm) : []);
    setDataCTM(ctm ? JSON.parse(ctm) : []);
    setDataENG(eng ? JSON.parse(eng) : []);
  };

  useEffect(() => { if (isFocused) loadAll(); }, [isFocused, selectedStudent]);

  const confirmDelete = (category: string, id: string) => {
    Alert.alert("Delete Entry", "Are you sure you want to remove this record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteEntry(category, id) }
    ]);
  };

  const deleteEntry = async (category: string, id: string) => {
    const storageKey = `data_${selectedStudent}_${category}`;
    const rawData = await AsyncStorage.getItem(storageKey);
    if (rawData) {
      const history = JSON.parse(rawData);
      const updated = history.filter((item: any) => item.id !== id);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      loadAll(); // Refresh screen
    }
  };

  const renderSection = (title: string, data: any[], color: string, category: string) => (
    <View style={styles.section}>
      <Text style={[styles.chartTitle, {color}]}>{title}</Text>
      
      {data.length > 1 ? (
        <LineChart 
          data={data} 
          width={Dimensions.get('window').width - 80} 
          color={color} 
          thickness={3} 
          dataPointsColor={color}
          noOfSections={4}
        />
      ) : (
        <Text style={styles.emptyText}>Add more books to see progress graph.</Text>
      )}

      <View style={styles.historyList}>
        <Text style={styles.historyHeader}>History:</Text>
        {data.slice().reverse().map((item) => (
          <View key={item.id} style={styles.historyItem}>
            <View>
              <Text style={styles.itemDate}>{item.date}</Text>
              <Text style={styles.itemLabel}>{item.label} — {item.value} Errors</Text>
            </View>
            <TouchableOpacity onPress={() => confirmDelete(category, item.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Progress Dashboard</Text>
      
      <View style={styles.pickerContainer}>
        <Text>Student:</Text>
        <Picker selectedValue={selectedStudent} onValueChange={setSelectedStudent}>
          {students.map(s => <Picker.Item key={s} label={s} value={s} />)}
        </Picker>
      </View>

      {renderSection("Basic Thinking Math", dataBTM, "#007AFF", "BTM")}
      {renderSection("Critical Thinking Math", dataCTM, "#FF9500", "CTM")}
      {renderSection("English", dataENG, "#4CD964", "English")}
      
      <View style={{height: 60}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#f4f4f4', paddingTop: 50 },
  header: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  pickerContainer: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 10, marginBottom: 20 },
  section: { marginBottom: 25, padding: 15, borderRadius: 20, backgroundColor: 'white', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emptyText: { color: '#999', fontStyle: 'italic', textAlign: 'center', marginVertical: 20 },
  historyList: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 10 },
  historyHeader: { fontWeight: 'bold', fontSize: 14, color: '#666', marginBottom: 10 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  itemDate: { fontSize: 12, color: '#888' },
  itemLabel: { fontSize: 15, fontWeight: '500' },
  deleteText: { color: '#FF3B30', fontWeight: 'bold', padding: 5 }
});