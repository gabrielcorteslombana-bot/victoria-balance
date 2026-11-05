# ✨ VICTORIA BALANCE 2.0.0
### Aplicación Web Financiera Personal, Diaria y Persistente

Aplicación construida en base a la especificación técnica completa:
- **Frontend**: React + TypeScript + Vite + TailwindCSS + Lucide Icons + PWA (listo para añadir a pantalla de inicio en iPhone/Safari y navegadores de escritorio).
- **Backend**: Node.js + Express + TypeScript + REST API.
- **Base de Datos**: PostgreSQL con Prisma ORM y tipos `DECIMAL(14,2)` para cálculo financiero con **cero errores de redondeo** (`decimal.js`).
- **Seguridad**: Autenticación JWT, contraseñas hasheadas con Bcrypt y aislamiento total por `user_id`.
- **Auditoría**: Trazabilidad en tabla `audit_logs`.

---

## 🚀 Ubicación del Proyecto

El proyecto está ubicado en tu carpeta de **Descargas**:
```
C:\Users\jesus.cortes\Downloads\victoria-balance
├── client/     # Frontend Web React + PWA (Puerto 5173)
└── server/     # Backend REST API Node.js + Prisma (Puerto 5000)
```
*(El directorio corporativo `IrisDiscountWeb` permanece completamente intacto y protegido).*

---

## 🔑 Credenciales de Prueba (Semilla Automática)

- **Email**: `victoria@balance.app`
- **Contraseña**: `Victoria2026*`

*(También puedes registrar cualquier cuenta nueva con aislamiento individual de datos).*

---

## 📦 Puesta en Marcha

### 1. Iniciar Servidor Backend (API & PostgreSQL)
```powershell
cd "C:\Users\jesus.cortes\Downloads\victoria-balance\server"
npm run dev
```

### 2. Iniciar Cliente Web (Frontend)
```powershell
cd "C:\Users\jesus.cortes\Downloads\victoria-balance\client"
npm run dev
```
Acceder en tu navegador a: **`http://localhost:5173`**

---

## 📊 Reglas de Negocio Implementadas y Validadas

1. **Uso Diario y Continuo**: Registros inmediatos de ingresos y gastos con recálculo dinámico en el Dashboard sin necesidad de formularios de cierre de fin de mes.
2. **Listas de Compras Independientes**: Módulo *"Mis Listas"* con avance, productos pendientes, duplicación de listas con pendientes y **aislamiento financiero total** (marcar comprado nunca genera un gasto automático ni altera el saldo).
3. **Presupuesto Mensual por Categoría**: Asignación por mes, comparación con gastos reales, alertas automáticas ante sobregiros y función *"Copiar del Mes Anterior"*.
4. **Cero Invención de Datos**: Aritmética decimal exacta (`Decimal.js`), asignación de *"Pago sin nombre"* o *"Sin clasificar"* cuando corresponda.
5. **Conciliación y Cierre de Período**: Comparación con extracto bancario y protección de períodos `CLOSED`.
