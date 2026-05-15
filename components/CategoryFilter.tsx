import { CATEGORIES, CATEGORY_ICONS } from '@/constants/Categories';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/Themecontext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  const { isDarkMode } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <TouchableOpacity
          style={[
            styles.chip,
            isDarkMode && styles.chipDark,
            selectedCategory === 'All' && styles.chipActive,
          ]}
          onPress={() => onSelectCategory('All')}
        >
          <Text
            style={[
              styles.chipText,
              isDarkMode && styles.chipTextDark,
              selectedCategory === 'All' && styles.chipTextActive,
            ]}
          >
            {t('categories.All')}
          </Text>
        </TouchableOpacity>

        {/* Pinned Category */}
        <TouchableOpacity
          style={[
            styles.chip,
            isDarkMode && styles.chipDark,
            selectedCategory === 'Pinned' && styles.chipActive,
          ]}
          onPress={() => onSelectCategory('Pinned')}
        >
          <Ionicons 
            name="pin" 
            size={14} 
            color={selectedCategory === 'Pinned' ? '#fff' : '#6200EE'} 
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.chipText,
              isDarkMode && styles.chipTextDark,
              selectedCategory === 'Pinned' && styles.chipTextActive,
            ]}
          >
           {t('home.pinned')}
          </Text>
        </TouchableOpacity>

        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.chip,
              isDarkMode && styles.chipDark,
              selectedCategory === category && styles.chipActive,
            ]}
            onPress={() => onSelectCategory(category)}
          >
            <Text style={styles.chipIcon}>{CATEGORY_ICONS[category]}</Text>
            <Text
              style={[
                styles.chipText,
                isDarkMode && styles.chipTextDark,
                selectedCategory === category && styles.chipTextActive,
              ]}
            >
              {t(`categories.${category}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    height: 50,
    marginBottom: 8,
  },
  contentContainer: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
  },
  chipDark: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
  },
  chipActive: {
    backgroundColor: '#faab00',
    borderColor: '#faab00',
  },
  chipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  chipTextDark: {
    color: '#999',
  },
  chipTextActive: {
    color: '#fff',
  },
});