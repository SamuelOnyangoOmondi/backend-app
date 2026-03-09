package com.farmtopalm.terminal.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen(
    apiBaseUrl: String,
    onApiBaseUrlChange: (String) -> Unit,
    apiBaseUrlFallback: String,
    onApiBaseUrlFallbackChange: (String) -> Unit,
    onSaveUrls: () -> Unit,
    mealRequiresPalm: Boolean,
    onMealRequiresPalmChange: (Boolean) -> Unit,
    onAdminPinChange: () -> Unit,
    onBack: () -> Unit
) {
    Column(Modifier.fillMaxSize().padding(24.dp)) {
        Text("Settings", style = MaterialTheme.typography.headlineMedium)
        Spacer(Modifier.height(16.dp))
        Text("Primary API URL (cloud / Supabase)", style = MaterialTheme.typography.titleSmall)
        Text("Set in backend .env as BACKEND_PUBLIC_URL; device uses Supabase when online. When offline, events are stored locally and sync when back online.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(4.dp))
        OutlinedTextField(
            value = apiBaseUrl,
            onValueChange = onApiBaseUrlChange,
            placeholder = { Text("https://your-backend.example.com") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(12.dp))
        Text("Fallback API URL (when no internet)", style = MaterialTheme.typography.titleSmall)
        Text("Optional. Local backend URL (e.g. http://192.168.1.5:3000) used only when the primary is unreachable.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(4.dp))
        OutlinedTextField(
            value = apiBaseUrlFallback,
            onValueChange = onApiBaseUrlFallbackChange,
            placeholder = { Text("http://192.168.1.128:3000") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth()
        )
        Button(onClick = onSaveUrls, modifier = Modifier.padding(top = 8.dp)) { Text("Save URLs") }
        Spacer(Modifier.height(8.dp))
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text("Meal requires palm")
            Switch(checked = mealRequiresPalm, onCheckedChange = onMealRequiresPalmChange)
        }
        Spacer(Modifier.height(8.dp))
        TextButton(onClick = onAdminPinChange, modifier = Modifier.heightIn(min = 68.dp)) { Text("Change admin PIN") }
        Spacer(Modifier.height(16.dp))
        TextButton(onClick = onBack, modifier = Modifier.heightIn(min = 68.dp)) { Text("Back") }
    }
}
