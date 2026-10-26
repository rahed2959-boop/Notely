import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import {
  createNoteId,
  formatNoteDate,
  NOTES_STORAGE_KEY,
  Note,
  STARTER_NOTES,
} from "@/lib/notes";

type Filter = "all" | "pinned" | "archived";
type EditorState = { id?: string; title: string; body: string; tags: string[] };

const ACCENT = "#E8A629";
const PAPER = "#FBF8F1";
const DARK_PAPER = "#191B1F";
const INK = "#20242B";
const MUTED = "#7D827F";
const CLAY = "#C56B55";
const EMPTY_EDITOR: EditorState = { title: "", body: "", tags: [] };

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [tagDraft, setTagDraft] = useState("");

  const loadNotes = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (stored) setNotes(JSON.parse(stored) as Note[]);
      else {
        await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(STARTER_NOTES));
        setNotes(STARTER_NOTES);
      }
    } catch {
      setNotes(STARTER_NOTES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useFocusEffect(useCallback(() => void loadNotes(), [loadNotes]));

  const persistNotes = useCallback(async (nextNotes: Note[]) => {
    setNotes(nextNotes);
    await AsyncStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(nextNotes));
  }, []);

  const tags = useMemo(() => {
    return Array.from(new Set(notes.flatMap((note) => note.tags))).sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const visibleNotes = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes
      .filter((note) => {
        if (filter === "pinned" && (!note.pinned || note.archived)) return false;
        if (filter === "archived" && !note.archived) return false;
        if (filter === "all" && note.archived) return false;
        if (selectedTag && !note.tags.includes(selectedTag)) return false;
        if (!query) return true;
        return [note.title, note.body, ...note.tags].some((value) => value.toLowerCase().includes(query));
      })
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [filter, notes, search, selectedTag]);

  const openNewNote = () => {
    setTagDraft("");
    setEditor({ ...EMPTY_EDITOR });
  };

  const openEditor = (note: Note) => {
    setTagDraft("");
    setEditor({ id: note.id, title: note.title, body: note.body, tags: note.tags });
  };

  const addTag = () => {
    const nextTags = tagDraft
      .split(",")
      .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, " "))
      .filter(Boolean);
    if (!nextTags.length || !editor) return;
    setEditor({ ...editor, tags: Array.from(new Set([...editor.tags, ...nextTags])) });
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    if (editor) setEditor({ ...editor, tags: editor.tags.filter((item) => item !== tag) });
  };

  const saveEditor = async () => {
    if (!editor) return;
    const now = new Date().toISOString();
    const existing = editor.id ? notes.find((note) => note.id === editor.id) : undefined;
    const saved: Note = {
      id: editor.id ?? createNoteId(),
      title: editor.title.trim() || "Untitled note",
      body: editor.body.trim(),
      tags: editor.tags,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      pinned: existing?.pinned ?? false,
      archived: existing?.archived ?? false,
    };
    const nextNotes = existing ? notes.map((note) => (note.id === saved.id ? saved : note)) : [saved, ...notes];
    await persistNotes(nextNotes);
    setEditor(null);
  };

  const toggleNoteState = async (note: Note, key: "pinned" | "archived") => {
    const nextNotes = notes.map((item) =>
      item.id === note.id ? { ...item, [key]: !item[key], updatedAt: new Date().toISOString() } : item,
    );
    await persistNotes(nextNotes);
  };

  const deleteNote = (note: Note) => {
    const remove = async () => {
      await persistNotes(notes.filter((item) => item.id !== note.id));
      setEditor(null);
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm?.("Delete this note? This cannot be undone.")) void remove();
      return;
    }
    Alert.alert("Delete note?", "This cannot be undone.", [
      { text: "Keep it", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void remove() },
    ]);
  };

  const displayedCount = notes.filter((note) => !note.archived).length;
  const archivedCount = notes.filter((note) => note.archived).length;
  const isDark = colors.background === "#191B1F" || colors.background === "#151718";
  const background = isDark ? DARK_PAPER : PAPER;
  const foreground = isDark ? "#F5F1E8" : INK;
  const surface = isDark ? "#24272C" : "#FFFFFF";
  const border = isDark ? "#353A42" : "#E9E2D5";

  return (
    <ScreenContainer containerClassName="bg-background" edges={["top", "left", "right"]}>
      <View style={[styles.container, { backgroundColor: background }]}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 112 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}><View style={styles.brandFold} /></View>
              <Text style={[styles.wordmark, { color: foreground }]}>notely</Text>
            </View>
            <View style={styles.headerMeta}>
              <Text style={[styles.headerMetaNumber, { color: foreground }]}>{displayedCount}</Text>
              <Text style={[styles.headerMetaLabel, { color: MUTED }]}>active notes</Text>
            </View>
          </View>

          <View style={styles.introRow}>
            <View style={styles.introCopy}>
              <Text style={[styles.eyebrow, { color: ACCENT }]}>YOUR NOTEBOOK</Text>
              <Text style={[styles.title, { color: foreground }]}>Keep the good ideas close.</Text>
            </View>
            <View style={styles.archiveCount}>
              <MaterialCommunityIcons name="archive-outline" size={16} color={MUTED} />
              <Text style={[styles.archiveCountText, { color: MUTED }]}>{archivedCount}</Text>
            </View>
          </View>

          <View style={[styles.searchBox, { backgroundColor: surface, borderColor: border }]}>
            <MaterialCommunityIcons name="magnify" size={21} color={MUTED} />
            <TextInput value={search} onChangeText={setSearch} placeholder="Search your notes" placeholderTextColor={MUTED} style={[styles.searchInput, { color: foreground }]} returnKeyType="search" />
            {search.length > 0 ? <Pressable onPress={() => setSearch("")} hitSlop={10}><MaterialCommunityIcons name="close-circle" size={18} color={MUTED} /></Pressable> : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            <FilterChip label="All notes" active={filter === "all"} onPress={() => setFilter("all")} />
            <FilterChip label="Pinned" icon="pin-outline" active={filter === "pinned"} onPress={() => setFilter("pinned")} />
            <FilterChip label="Archived" icon="archive-outline" active={filter === "archived"} onPress={() => setFilter("archived")} />
            {tags.map((tag) => <FilterChip key={tag} label={`#${tag}`} icon="tag-outline" active={selectedTag === tag} onPress={() => setSelectedTag(selectedTag === tag ? null : tag)} />)}
          </ScrollView>

          <View style={styles.sectionHeading}>
            <Text style={[styles.sectionTitle, { color: foreground }]}>{filter === "archived" ? "Archive" : filter === "pinned" ? "Pinned notes" : "Recent notes"}</Text>
            <Text style={[styles.sectionCount, { color: MUTED }]}>{visibleNotes.length}</Text>
          </View>

          {!isLoaded ? null : visibleNotes.length === 0 ? (
            <EmptyState archived={filter === "archived"} hasSearch={Boolean(search || selectedTag)} foreground={foreground} surface={surface} border={border} onCreate={openNewNote} onClear={() => { setSearch(""); setSelectedTag(null); }} />
          ) : (
            <View style={styles.noteList}>{visibleNotes.map((note) => <NoteCard key={note.id} note={note} foreground={foreground} surface={surface} border={border} onOpen={() => openEditor(note)} onPin={() => void toggleNoteState(note, "pinned")} onArchive={() => void toggleNoteState(note, "archived")} />)}</View>
          )}
        </ScrollView>

        <Pressable accessibilityRole="button" accessibilityLabel="Create a new note" onPress={openNewNote} style={({ pressed }) => [styles.fab, { bottom: Math.max(insets.bottom, 18) + 18, transform: [{ scale: pressed ? 0.96 : 1 }] }]}>
          <MaterialCommunityIcons name="plus" size={27} color="#221B0D" />
          <Text style={styles.fabText}>New note</Text>
        </Pressable>
      </View>

      <Modal visible={Boolean(editor)} animationType="slide" transparent onRequestClose={() => setEditor(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalBackdrop}>
          <View style={[styles.editorSheet, { backgroundColor: background }]}>
            <View style={styles.editorHeader}>
              <Pressable onPress={() => setEditor(null)} hitSlop={12}><MaterialCommunityIcons name="close" size={24} color={foreground} /></Pressable>
              <Text style={[styles.editorTitle, { color: foreground }]}>{editor?.id ? "Edit note" : "New note"}</Text>
              <Pressable onPress={() => void saveEditor()} hitSlop={12}><Text style={styles.saveText}>Save</Text></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <TextInput autoFocus value={editor?.title ?? ""} onChangeText={(title) => setEditor((current) => current ? { ...current, title } : current)} placeholder="Note title" placeholderTextColor={MUTED} style={[styles.editorTitleInput, { color: foreground, borderBottomColor: border }]} maxLength={80} />
              <TextInput value={editor?.body ?? ""} onChangeText={(body) => setEditor((current) => current ? { ...current, body } : current)} placeholder="Start writing..." placeholderTextColor={MUTED} multiline textAlignVertical="top" style={[styles.editorBodyInput, { color: foreground }]} />
              <View style={styles.editorSection}>
                <View style={styles.editorLabelRow}><Text style={[styles.editorLabel, { color: MUTED }]}>TAGS</Text><Text style={[styles.editorHint, { color: MUTED }]}>comma separated</Text></View>
                <View style={styles.tagEditorRow}>
                  <TextInput value={tagDraft} onChangeText={setTagDraft} onSubmitEditing={addTag} placeholder="Add a tag" placeholderTextColor={MUTED} style={[styles.tagInput, { color: foreground, borderColor: border }]} returnKeyType="done" />
                  <Pressable onPress={addTag} style={styles.addTagButton}><MaterialCommunityIcons name="plus" size={20} color={INK} /></Pressable>
                </View>
                <View style={styles.editorTags}>{editor?.tags.map((tag) => <Pressable key={tag} onPress={() => removeTag(tag)} style={styles.editorTag}><Text style={styles.editorTagText}>#{tag}</Text><MaterialCommunityIcons name="close" size={13} color="#805C1B" /></Pressable>)}</View>
              </View>
              {editor?.id ? <View style={styles.editorActions}><Pressable onPress={() => { const current = notes.find((note) => note.id === editor.id); if (current) deleteNote(current); }} style={styles.deleteButton}><MaterialCommunityIcons name="trash-can-outline" size={18} color={CLAY} /><Text style={styles.deleteText}>Delete note</Text></Pressable></View> : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

function FilterChip({ label, icon, active, onPress }: { label: string; icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"]; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>{icon ? <MaterialCommunityIcons name={icon} size={15} color={active ? "#3D2A08" : MUTED} /> : null}<Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text></Pressable>;
}

function NoteCard({ note, foreground, surface, border, onOpen, onPin, onArchive }: { note: Note; foreground: string; surface: string; border: string; onOpen: () => void; onPin: () => void; onArchive: () => void }) {
  return <Pressable onPress={onOpen} style={({ pressed }) => [styles.noteCard, { backgroundColor: surface, borderColor: border, opacity: pressed ? 0.88 : 1 }, note.pinned && styles.noteCardPinned]}>
    <View style={[styles.noteRule, { backgroundColor: note.pinned ? ACCENT : border }]} />
    <View style={styles.noteCardContent}>
      <View style={styles.noteCardTopRow}><Text style={[styles.noteCardTitle, { color: foreground }]} numberOfLines={1}>{note.title}</Text><View style={styles.noteCardIcons}><Pressable onPress={onPin} hitSlop={9}><MaterialCommunityIcons name={note.pinned ? "pin" : "pin-outline"} size={18} color={note.pinned ? ACCENT : MUTED} /></Pressable><Pressable onPress={onArchive} hitSlop={9}><MaterialCommunityIcons name={note.archived ? "archive-arrow-up-outline" : "archive-outline"} size={18} color={MUTED} /></Pressable></View></View>
      <Text style={[styles.noteCardBody, { color: MUTED }]} numberOfLines={3}>{note.body || "No text yet — tap to keep writing."}</Text>
      <View style={styles.noteCardBottomRow}><View style={styles.noteTags}>{note.tags.slice(0, 2).map((tag) => <Text key={tag} style={styles.noteTag}>#{tag}</Text>)}</View><Text style={styles.noteDate}>{formatNoteDate(note.updatedAt)}</Text></View>
    </View>
  </Pressable>;
}

function EmptyState({ archived, hasSearch, foreground, surface, border, onCreate, onClear }: { archived: boolean; hasSearch: boolean; foreground: string; surface: string; border: string; onCreate: () => void; onClear: () => void }) {
  return <View style={[styles.emptyState, { backgroundColor: surface, borderColor: border }]}>
    <View style={styles.emptyIcon}><MaterialCommunityIcons name={archived ? "archive-outline" : hasSearch ? "magnify" : "note-plus-outline"} size={27} color={ACCENT} /></View>
    <Text style={[styles.emptyTitle, { color: foreground }]}>{hasSearch ? "Nothing matches that search" : archived ? "Your archive is clear" : "Nothing here yet"}</Text>
    <Text style={styles.emptyCopy}>{hasSearch ? "Try a different word or clear the filters." : archived ? "Archived notes will wait here when you are ready." : "Make the first note — even a sentence is enough."}</Text>
    <Pressable onPress={hasSearch ? onClear : onCreate} style={styles.emptyButton}><Text style={styles.emptyButtonText}>{hasSearch ? "Clear filters" : "Write a note"}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingTop: 12, paddingBottom: 22 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  brandMark: { width: 25, height: 29, borderRadius: 7, backgroundColor: ACCENT, justifyContent: "center", alignItems: "center", transform: [{ rotate: "-4deg" }] },
  brandFold: { width: 9, height: 13, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: "#5C4110", transform: [{ rotate: "-4deg" }] },
  wordmark: { fontSize: 21, fontWeight: "800", letterSpacing: -0.8 },
  headerMeta: { alignItems: "flex-end" },
  headerMetaNumber: { fontSize: 18, fontWeight: "800", lineHeight: 19 },
  headerMetaLabel: { fontSize: 11, marginTop: 2 },
  introRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 22, marginBottom: 20 },
  introCopy: { maxWidth: 290 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.8, marginBottom: 8 },
  title: { fontSize: 29, lineHeight: 32, fontWeight: "800", letterSpacing: -1.1 },
  archiveCount: { flexDirection: "row", alignItems: "center", gap: 5, paddingBottom: 4 },
  archiveCountText: { fontSize: 12, fontWeight: "700" },
  searchBox: { minHeight: 52, marginHorizontal: 22, borderRadius: 15, borderWidth: 1, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 13 },
  filterRow: { paddingHorizontal: 22, paddingVertical: 17, gap: 8 },
  filterChip: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: "#DED8CD", backgroundColor: "transparent" },
  filterChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  filterChipText: { color: MUTED, fontSize: 12, fontWeight: "700" },
  filterChipTextActive: { color: "#3D2A08" },
  sectionHeading: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  sectionCount: { fontSize: 12, fontWeight: "700" },
  noteList: { paddingHorizontal: 22, gap: 11 },
  noteCard: { minHeight: 143, borderRadius: 17, borderWidth: 1, overflow: "hidden", flexDirection: "row" },
  noteCardPinned: { borderColor: "#E4C77F" },
  noteRule: { width: 4 },
  noteCardContent: { flex: 1, padding: 15, paddingLeft: 14 },
  noteCardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  noteCardTitle: { flex: 1, fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  noteCardIcons: { flexDirection: "row", gap: 13 },
  noteCardBody: { fontSize: 14, lineHeight: 20, marginTop: 9, minHeight: 40 },
  noteCardBottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  noteTags: { flexDirection: "row", gap: 6, flex: 1 },
  noteTag: { color: "#A17825", fontSize: 11, fontWeight: "700" },
  noteDate: { color: MUTED, fontSize: 11, fontWeight: "600" },
  emptyState: { marginHorizontal: 22, borderRadius: 18, borderWidth: 1, borderStyle: "dashed", alignItems: "center", padding: 28, marginTop: 4 },
  emptyIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: "#FFF3D6", alignItems: "center", justifyContent: "center", marginBottom: 15 },
  emptyTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  emptyCopy: { color: MUTED, fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 7, maxWidth: 250 },
  emptyButton: { backgroundColor: ACCENT, paddingHorizontal: 17, paddingVertical: 11, borderRadius: 11, marginTop: 18 },
  emptyButtonText: { color: "#3D2A08", fontSize: 13, fontWeight: "800" },
  fab: { position: "absolute", right: 22, minHeight: 54, paddingHorizontal: 17, borderRadius: 18, backgroundColor: ACCENT, flexDirection: "row", alignItems: "center", gap: 7, shadowColor: "#6E4B0D", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 },
  fabText: { color: "#3D2A08", fontSize: 13, fontWeight: "900" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(25, 27, 31, 0.4)" },
  editorSheet: { minHeight: "78%", maxHeight: "94%", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 22, paddingTop: 15 },
  editorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 17 },
  editorTitle: { fontSize: 16, fontWeight: "800" },
  saveText: { color: ACCENT, fontSize: 15, fontWeight: "900" },
  editorTitleInput: { fontSize: 27, fontWeight: "800", paddingVertical: 15, borderBottomWidth: 1, letterSpacing: -0.8 },
  editorBodyInput: { minHeight: 190, fontSize: 16, lineHeight: 24, paddingTop: 18 },
  editorSection: { marginTop: 8 },
  editorLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 9 },
  editorLabel: { fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  editorHint: { fontSize: 11 },
  tagEditorRow: { flexDirection: "row", gap: 8 },
  tagInput: { flex: 1, minHeight: 45, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 14 },
  addTagButton: { width: 45, height: 45, borderRadius: 12, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center" },
  editorTags: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 10 },
  editorTag: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7, backgroundColor: "#FFF0C9" },
  editorTagText: { color: "#805C1B", fontSize: 12, fontWeight: "800" },
  editorActions: { borderTopWidth: 1, borderTopColor: "#E9E2D5", marginTop: 30, paddingTop: 20 },
  deleteButton: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 },
  deleteText: { color: CLAY, fontSize: 14, fontWeight: "800" },
});
