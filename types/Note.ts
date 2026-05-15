// types/Note.ts
import { Category } from '@/constants/Categories';
import { NoteColor } from '@/constants/Colors';

export interface TextStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  list: boolean;
  leftBorder: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  category: Category;
  images: string[];
  textStyle: TextStyle;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  tableData?: TableData;
  themeId?: string;        // per-note theme  e.g. 'theme1' | 'none' | undefined
}

export interface NoteFormData {
  title: string;
  content: string;
  color: NoteColor;
  category: Category;
  images: string[];
  textStyle: TextStyle;
  tableData?: TableData;
  themeId?: string;        // per-note theme
}

export interface TableData {
  rows: number;
  cols: number;
  cellData: string[][];
}