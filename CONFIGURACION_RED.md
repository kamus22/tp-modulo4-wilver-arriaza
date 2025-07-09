# 🌐 Configuración de Red Sepolia - SimpleSwap DEX

## 📋 Información de Contratos

### Contratos Desplegados en Sepolia
```
SimpleSwap: 0x071251ee45b08f0b6d978b87b6a1350aa4d22ef4
TokenA:     0xb2386ba07061960efff179939b620d345400a446
TokenB:     0x7d0f0051a7d02aa6cc870254cf94b9735a43d092
```

### Enlaces de Etherscan
- **SimpleSwap**: https://sepolia.etherscan.io/address/0x071251ee45b08f0b6d978b87b6a1350aa4d22ef4
- **TokenA**: https://sepolia.etherscan.io/address/0xb2386ba07061960efff179939b620d345400a446
- **TokenB**: https://sepolia.etherscan.io/address/0x7d0f0051a7d02aa6cc870254cf94b9735a43d092

## 🔧 Configuración de MetaMask

### Agregar Red Sepolia Manualmente
```
Network Name: Sepolia Testnet
RPC URL: https://sepolia.infura.io/v3/
Chain ID: 11155111
Currency Symbol: ETH
Block Explorer: https://sepolia.etherscan.io
```

### Configuración Automática
Ambos frontends incluyen configuración automática que:
- ✅ Detecta si estás en Sepolia
- ✅ Cambia automáticamente a Sepolia
- ✅ Agrega la red si no está configurada

## 💧 Obtener ETH de Testnet

### Faucets Recomendados
1. **Sepolia Faucet**: https://sepoliafaucet.com/
2. **Alchemy Faucet**: https://sepoliafaucet.com/
3. **Infura Faucet**: https://www.infura.io/faucet/sepolia

### Proceso
1. Conectar MetaMask al faucet
2. Ingresar tu dirección de wallet
3. Solicitar ETH (normalmente 0.1-0.5 ETH)
4. Esperar confirmación (1-2 minutos)

## 🪙 Obtener Tokens de Prueba

### Opción 1: Usar función mint() en Etherscan
1. **TokenA**: https://sepolia.etherscan.io/address/0xb2386ba07061960efff179939b620d345400a446#writeContract
2. **TokenB**: https://sepolia.etherscan.io/address/0x7d0f0051a7d02aa6cc870254cf94b9735a43d092#writeContract

**Pasos**:
1. Ir al enlace correspondiente
2. Conectar MetaMask
3. Expandir función "mint"
4. `_to`: Tu dirección de wallet
5. `_amount`: Cantidad deseada (ej: 1000000000000000000000 = 1000 tokens)
6. Write → Confirmar en MetaMask

### Opción 2: Intercambio pequeño
1. Obtener algunos tokens usando mint()
2. Realizar swaps pequeños para obtener ambos tokens
3. Los contratos ya tienen ~300,000 tokens de liquidez

## 🔍 Verificar Estado de Contratos

### Verificar Liquidez
```
SimpleSwap → reserves(TokenA, TokenB)
SimpleSwap → reserves(TokenB, TokenA)
```

### Verificar tus Balances
```
TokenA → balanceOf(tu_address)
TokenB → balanceOf(tu_address)
```

### Verificar Precio Actual
```
SimpleSwap → getPrice(TokenA, TokenB)
```

## 🚨 Troubleshooting

### Error: "Please switch to Sepolia testnet"
- **Solución**: Los frontends cambian automáticamente
- **Manual**: Cambiar red en MetaMask

### Error: "Insufficient funds for gas"
- **Solución**: Obtener más ETH del faucet
- **Nota**: Necesitas ETH para todas las transacciones

### Error: "No liquidity"
- **Verificar**: Que los contratos tengan liquidez
- **Solución**: Los contratos ya tienen liquidez inicial

### Frontend no conecta
- **Verificar**: MetaMask instalado y desbloqueado
- **Solución**: Refrescar página, verificar permisos

## 📊 Configuración en el Código

### Frontend React
```javascript
// En src/App.js
const CONTRACTS = {
  SIMPLE_SWAP: '0x071251ee45b08f0b6d978b87b6a1350aa4d22ef4',
  TOKEN_A: '0xb2386ba07061960efff179939b620d345400a446',
  TOKEN_B: '0x7d0f0051a7d02aa6cc870254cf94b9735a43d092'
};
```

### Frontend Vanilla
```javascript
// En app.js
const CONTRACTS = {
    SIMPLE_SWAP: '0x071251ee45b08f0b6d978b87b6a1350aa4d22ef4',
    TOKEN_A: '0xb2386ba07061960efff179939b620d345400a446',
    TOKEN_B: '0x7d0f0051a7d02aa6cc870254cf94b9735a43d092'
};
```

## ✅ Checklist de Configuración

### Para Usuarios
- [ ] MetaMask instalado
- [ ] Red Sepolia configurada (automática)
- [ ] ETH de testnet obtenido
- [ ] Tokens de prueba obtenidos (opcional)
- [ ] Frontend accesible

### Para Desarrolladores
- [ ] Direcciones de contratos correctas
- [ ] ABIs incluidos
- [ ] Verificación de red implementada
- [ ] Manejo de errores configurado
- [ ] Enlaces de ayuda incluidos

## 🎯 Todo está Configurado

**✅ NO necesitas agregar usuarios o direcciones adicionales**
**✅ Los contratos ya están hardcodeados**
**✅ La verificación de red es automática**
**✅ Los enlaces de ayuda están incluidos**

**¡Tu dApp está lista para usar!** 🚀
