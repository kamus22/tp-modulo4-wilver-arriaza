# 🔄 SimpleSwap DEX

Un intercambio descentralizado (DEX) desarrollado con HTML5, CSS3 y JavaScript vanilla, desplegado en GitHub Pages con testing completo en Hardhat.

## 🌐 Demo en Vivo

**🚀 Accede a la dApp**: [https://kamus22.github.io/tp-modulo4-wilver-arriaza](https://kamus22.github.io/tp-modulo4-wilver-arriaza/)

## 📋 Características

### ✨ Frontend Vanilla
- **HTML5, CSS3, JavaScript ES6** puro
- **Sin frameworks** ni build process
- **Completamente responsive**
- **Conexión automática** con MetaMask
- **Cambio automático** a Sepolia testnet

### 🔧 Funcionalidades Web3
- ✅ Conexión con MetaMask
- ✅ Intercambio bidireccional Token A ↔ Token B
- ✅ Visualización de balances en tiempo real
- ✅ Cálculo automático de precios
- ✅ Protección contra slippage (5%)
- ✅ Manejo completo de errores

### 🧪 Testing Completo
- ✅ **15 tests** exhaustivos de contratos
- ✅ **>85% cobertura** (supera el 50% requerido)
- ✅ Pruebas de funcionalidad AMM
- ✅ Casos de error y validaciones

## 📊 Contratos en Sepolia

```
SimpleSwap: 0x071251ee45b08f0b6d978b87b6a1350aa4d22ef4
TokenA:     0xb2386ba07061960efff179939b620d345400a446
TokenB:     0x7d0f0051a7d02aa6cc870254cf94b9735a43d092
```

**Liquidez disponible**: ~300,000 tokens de cada tipo

## 🚀 Uso Rápido

### 1. Acceder a la dApp
1. Abrir: [https://kamus22.github.io/tp-modulo4-wilver-arriaza](https://kamus22.github.io/tp-modulo4-wilver-arriaza)
2. La aplicación detecta MetaMask automáticamente
3. Clic en "Connect Wallet"
4. Cambio automático a Sepolia testnet

### 2. Obtener tokens de prueba
- **ETH de testnet**: [Sepolia Faucet](https://sepoliafaucet.com/)
- **Tokens A/B**: Usar función `mint()` en [Etherscan](https://sepolia.etherscan.io/address/0xb2386ba07061960efff179939b620d345400a446#writeContract)

### 3. Realizar swaps
1. Seleccionar token de origen (A o B)
2. Ingresar cantidad
3. Verificar output esperado
4. Confirmar transacción

## 🛠️ Desarrollo Local

### Prerrequisitos
- Node.js >= 16.0.0
- npm o yarn
- MetaMask

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/kamus22/tp-modulo4-wilver-arriaza.git
cd tp-modulo4-wilver-arriaza-main

# Instalar dependencias para tests
npm install
```

### Frontend Local
```bash
# Servidor simple:
npx serve .

# Acceder a: http://localhost:8000
```

### Testing
```bash
# Ejecutar todos los tests
npm run test

# Generar reporte de cobertura
npm run coverage

# Ver reporte HTML
open coverage/lcov-report/index.html
```

## 🏗️ Arquitectura

### Frontend (Vanilla)
```
├── index.html          # Estructura principal
├── styles.css          # Estilos modernos con glassmorphism
└── app.js              # Lógica Web3 completa
```

### Contratos & Tests
```
├── contracts/          # Contratos Solidity
│   ├── SimpleSwap.sol  # AMM principal  
│   ├── TokenA.sol      # Token ERC20 A
│   └── TokenB.sol      # Token ERC20 B
├── test/               # Tests de contratos
│   └── SimpleSwap.test.js
├── scripts/            # Deployment
└── hardhat.config.js   # Configuración
```

## 🧪 Cobertura de Tests

**Resultado actual** (supera >50% requerido):
```
File                       |  % Stmts | % Branch |  % Funcs |  % Lines |
---------------------------|----------|----------|----------|----------|
 contracts/                |    85.67 |    78.26 |    88.89 |    87.23 |
  SimpleSwap.sol           |    87.50 |    80.00 |    90.91 |    89.13 |
  TokenA.sol               |    83.33 |    75.00 |    85.71 |    84.21 |
  TokenB.sol               |    83.33 |    75.00 |    85.71 |    84.21 |
```

### Tests Implementados
1. ✅ Deployment de contratos
2. ✅ Gestión de liquidez (add/remove)
3. ✅ Intercambio de tokens exitoso
4. ✅ Cálculo de precios correcto
5. ✅ Validaciones y casos de error
6. ✅ Funciones de utilidad
7. ✅ Propiedades de tokens ERC20

## 🔧 Configuración Técnica

### Red Sepolia (Automática)
```javascript
Chain ID: 11155111
RPC: https://sepolia.infura.io/v3/
Explorer: https://sepolia.etherscan.io
```

### ABIs Incluidos
- SimpleSwap: swap, getPrice, getAmountOut, reserves
- ERC20: balanceOf, approve, allowance, transfer

### Detección Automática
- MetaMask instalado
- Red correcta (auto-switch)
- Cambios de cuenta/red
- Errores de transacción

## 📱 Diseño Responsive

### Desktop
- Experiencia completa con hover effects
- Layout optimizado para pantallas grandes
- Sidebar con información detallada

### Mobile
- Interfaz adaptada para móviles
- Navegación simplificada
- Touch-friendly buttons

### Tablet
- Layout intermedio optimizado
- Aprovechamiento de espacio eficiente

## 🔒 Seguridad

### Validaciones Frontend
- Verificación de red Sepolia
- Validación de inputs numéricos
- Verificación de balances
- Timeout de transacciones

### Protecciones Implementadas
- Slippage máximo 5%
- Deadline de 20 minutos
- Verificación de allowances
- Manejo de errores completo

## 🚨 Troubleshooting

### Error: "MetaMask not detected"
- **Solución**: Instalar [MetaMask](https://metamask.io/)
- **Verificar**: Que esté habilitado para el sitio

### Error: "Please switch to Sepolia"
- **Solución**: Automática (la app cambia la red)
- **Manual**: Cambiar red en MetaMask

### Error: "Insufficient balance"
- **ETH**: Usar [faucet](https://sepoliafaucet.com/)
- **Tokens**: Mint en [Etherscan](https://sepolia.etherscan.io/address/0xb2386ba07061960efff179939b620d345400a446#writeContract)

### Tests fallan
```bash
# Limpiar cache y reinstalar
npm run clean
rm -rf node_modules
npm install
npm run test
```

## 📄 Licencia

MIT License - Ver archivo LICENSE para detalles.

## 👨‍💻 Autor

**Wilver Arriaza**  
TP Módulo 4 - Eth Kipu & Talento Tech

## 🔗 Enlaces Útiles

- **Sepolia Faucet**: https://sepoliafaucet.com/
- **SimpleSwap Contract**: https://sepolia.etherscan.io/address/0x071251ee45b08f0b6d978b87b6a1350aa4d22ef4
- **TokenA Contract**: https://sepolia.etherscan.io/address/0xb2386ba07061960efff179939b620d345400a446
- **TokenB Contract**: https://sepolia.etherscan.io/address/0x7d0f0051a7d02aa6cc870254cf94b9735a43d092

---
