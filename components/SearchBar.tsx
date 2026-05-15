import { useTheme } from '@/contexts/Themecontext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search notes...',
}) => {
  const { isDarkMode } = useTheme();

  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={[
      styles.container,
      isDarkMode && styles.containerDark
    ]}>
      <Ionicons 
        name="search" 
        size={20} 
        color={isDarkMode ? '#999' : '#666'} 
        style={styles.icon} 
      />
      <TextInput
        style={[
          styles.input,
          isDarkMode && styles.inputDark
        ]}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={isDarkMode ? '#666' : '#999'}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons 
            name="close-circle" 
            size={20} 
            color={isDarkMode ? '#666' : '#999'} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#1e1e1e',
    shadowOpacity: 0.3,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputDark: {
    color: '#fff',
  },
  clearButton: {
    padding: 4,
  },
});