# 🔧 Correção - Z-Index do Header

## 🐛 Problema

A barra de busca estava por baixo do menu hamburger no mobile.

### Causa
- Header tinha `z-40`
- Menu hamburger tinha `z-50`
- Menu hamburger estava acima do header

---

## ✅ Solução

Aumentar o z-index do header para `z-[60]` para ficar acima do menu hamburger.

### Mudança

```typescript
// ANTES
<header className="... z-40 ...">

// DEPOIS
<header className="... z-[60] ...">
```

---

## 📊 Z-Index Stack

```
z-[60]  ← Header (barra de busca)
z-50    ← Menu hamburger
z-40    ← Overlay/Conteúdo
```

---

## ✨ Resultado

✅ Barra de busca agora fica acima do menu hamburger
✅ Sem encostamento
✅ Sem sobreposição
✅ Layout correto

---

## ✅ Status

**Status**: ✅ **CORRIGIDO**

A barra de busca agora está no z-index correto e fica visível acima do menu hamburger.

