'use client';
import {
  Cursor,
  CursorBody,
  CursorMessage,
  CursorName,
  CursorPointer,
} from '@/components/ui/shadcn-io/cursor';
const CustomUsersCursor = ({name,email}: {name: string,email: string}) => (
  <Cursor>
    <CursorPointer className="text-indigo-500" />
    <CursorBody className="bg-indigo-50 text-indigo-700">
      <CursorName>@{name}</CursorName>
      <CursorMessage>Can we adjust the color?</CursorMessage>
    </CursorBody>
  </Cursor>
);
export default CustomUsersCursor;