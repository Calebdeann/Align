# Bugs & Lessons Learned

## Critical Rules (Always Follow)

1. Always use expo-secure-store for auth tokens, never AsyncStorage
2. Start with Slot instead of Stack/Tabs - add complexity only when needed
3. Test navigation changes one screen at a time

---

## Bug Log

### 2026-01-16 - Navigation - TypeError boolean/string

**Problem:** `TypeError: expected dynamic type 'boolean', but had type 'string'`
**Root Cause:** Tabs navigator with screenOptions conflicts with RN new architecture
**Solution:** Use simple Slot-based routing, avoid complex navigators
**Prevention Rule:** Start minimal, add navigation complexity only when proven stable
