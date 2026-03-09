package com.farmtopalm.terminal.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.farmtopalm.terminal.biometric.PalmBiometricManager
import com.farmtopalm.terminal.biometric.PalmSdkBridge
import com.farmtopalm.terminal.data.db.entities.StudentEntity
import com.farmtopalm.terminal.util.Result

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnrollmentScreen(
    palmManager: PalmBiometricManager,
    adminPinVerified: Boolean,
    schoolId: String,
    schoolName: String?,
    students: List<StudentEntity>,
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    onRequestPin: (onVerified: () -> Unit) -> Unit,
    onSaveTemplate: (externalId: String, name: String, hand: String, rgb: ByteArray, ir: ByteArray, quality: Int, streamType: String?, rgbModelHash: String?, irModelHash: String?, sdkTemplateId: String?, onSaved: () -> Unit) -> Unit,
    onBack: () -> Unit,
    onSyncStudents: () -> Unit = {},
    syncStudentsMessage: String? = null,
    syncStudentsLoading: Boolean = false
) {
    var selectedStudent by remember { mutableStateOf<StudentEntity?>(null) }
    var hand by remember { mutableStateOf("left") }
    var status by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    var openReady by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    if (!adminPinVerified) {
        LaunchedEffect(Unit) { onRequestPin { } }
        return
    }

    LaunchedEffect(Unit) {
        status = "Opening scanner..."
        palmManager.open(scope) { openResult ->
            openReady = true
            when (openResult) {
                is Result.Error -> status = "Error: ${(openResult as Result.Error).message}"
                is Result.Success -> status = ""
            }
        }
    }

    val cardShape = RoundedCornerShape(8.dp)
    val textFieldColors = OutlinedTextFieldDefaults.colors(
        focusedBorderColor = MaterialTheme.colorScheme.primary,
        focusedLabelColor = MaterialTheme.colorScheme.primary,
        cursorColor = MaterialTheme.colorScheme.primary,
        focusedLeadingIconColor = MaterialTheme.colorScheme.primary,
        focusedTrailingIconColor = MaterialTheme.colorScheme.primary
    )

    Column(
        Modifier
            .fillMaxSize()
            .padding(24.dp)
            .statusBarsPadding()
            .navigationBarsPadding()
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = cardShape,
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
        ) {
            Column(Modifier.padding(24.dp)) {
                Text(
                    "Enrollment",
                    style = MaterialTheme.typography.headlineMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Spacer(Modifier.height(8.dp))
                Text(
                    "School: ${schoolName ?: schoolId}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(Modifier.height(16.dp))

                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = onSearchChange,
                    label = { Text("Search students") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp),
                    colors = textFieldColors
                )
                Spacer(Modifier.height(8.dp))

                if (students.isEmpty()) {
                    Text(
                        "No students. Sync from Supa School first.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(8.dp))
                    FilledTonalButton(
                        onClick = onSyncStudents,
                        modifier = Modifier.fillMaxWidth().heightIn(min = 48.dp),
                        shape = RoundedCornerShape(8.dp),
                        enabled = !syncStudentsLoading,
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.secondaryContainer,
                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    ) { Text(if (syncStudentsLoading) "Syncing…" else "Sync students from Supa School") }
                    if (syncStudentsMessage != null) {
                        Spacer(Modifier.height(4.dp))
                        Text(
                            syncStudentsMessage,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                } else {
                    Text(
                        "Select a student to enroll palm:",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(Modifier.height(8.dp))
                    LazyColumn(
                        modifier = Modifier.heightIn(max = 180.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        items(students) { s ->
                            val isSelected = selectedStudent?.id == s.id
                            Card(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .clickable { selectedStudent = s },
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer
                                    else MaterialTheme.colorScheme.surface
                                ),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Row(
                                    Modifier.padding(12.dp),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        s.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer
                                        else MaterialTheme.colorScheme.onSurface
                                    )
                                    Text(
                                        s.externalId,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = if (isSelected) MaterialTheme.colorScheme.onPrimaryContainer
                                        else MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                    }
                }

                Spacer(Modifier.height(16.dp))
                HandDropdown(
                    value = hand,
                    onChange = { hand = it },
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    status,
                    color = if (status.startsWith("Error:") || status.startsWith("Capture failed")) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.padding(top = 8.dp)
                )
                if (status.contains("already in use") || status.contains("device index")) {
                    FilledTonalButton(
                        onClick = {
                            openReady = false
                            status = "Opening scanner..."
                            palmManager.release()
                            palmManager.open(scope) { openResult ->
                                openReady = true
                                when (openResult) {
                                    is Result.Error -> status = "Error: ${(openResult as Result.Error).message}"
                                    is Result.Success -> status = ""
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth().padding(top = 8.dp).heightIn(min = 56.dp),
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.secondaryContainer,
                            contentColor = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                    ) { Text("Retry scanner") }
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                val student = selectedStudent
                if (student == null || !openReady || loading) return@Button
                loading = true
                status = "Capturing..."
                palmManager.captureForEnroll(scope, hand) { capResult ->
                    when (capResult) {
                        is Result.Success -> {
                            val rgb = capResult.value.rgbFeature ?: ByteArray(0)
                            val ir = capResult.value.irFeature ?: ByteArray(0)
                            val v = capResult.value
                            onSaveTemplate(
                                student.externalId,
                                student.name,
                                hand,
                                rgb,
                                ir,
                                v.quality,
                                v.streamType,
                                v.rgbModelHash,
                                v.irModelHash,
                                v.matchTemplateId
                            ) {
                                status = if (PalmSdkBridge.isUsingRealSdk) "Saved (vendor template)" else "Saved"
                                loading = false
                                selectedStudent = null
                            }
                        }
                        is Result.Error -> {
                            val msg = (capResult as Result.Error).message
                            status = "Capture failed: $msg"
                            if (msg.contains("TIMEOUT", ignoreCase = true) || msg.contains("no palm", ignoreCase = true)) {
                                status += "\nTip: Hold palm 2-4 cm above sensor, avoid shadows."
                            }
                            loading = false
                        }
                    }
                }
            },
            enabled = selectedStudent != null && !loading && openReady && !status.startsWith("Error:"),
            modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp),
            shape = RoundedCornerShape(8.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            )
        ) {
            Text(if (selectedStudent != null) "Capture & Save palm for ${selectedStudent!!.name}" else "Select a student first")
        }
        Spacer(Modifier.height(8.dp))
        TextButton(
            onClick = onBack,
            modifier = Modifier.heightIn(min = 48.dp),
            colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.primary)
        ) { Text("Back") }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HandDropdown(
    value: String,
    onChange: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val options = listOf("Left", "Right")
    var expanded by remember { mutableStateOf(false) }
    val displayValue = value.replaceFirstChar { if (it.isLowerCase()) it.titlecase() else it.toString() }

    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = !expanded },
        modifier = modifier
    ) {
        OutlinedTextField(
            value = displayValue,
            onValueChange = {},
            readOnly = true,
            label = { Text("Hand (Left/Right)") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .menuAnchor()
                .fillMaxWidth()
        )
        ExposedDropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            options.forEach { opt ->
                DropdownMenuItem(
                    text = { Text(opt) },
                    onClick = {
                        onChange(opt.lowercase())
                        expanded = false
                    }
                )
            }
        }
    }
}
