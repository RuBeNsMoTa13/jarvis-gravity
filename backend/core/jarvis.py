"""
Módulo de compatibilidade legada: reexporta AtomBrain e atom_brain como JarvisBrain e jarvis_brain.
Toda a lógica foi migrada e enriquecida em backend.core.atom.
"""
from .atom import AtomBrain, atom_brain, DEFAULT_SYSTEM_PROMPT

JarvisBrain = AtomBrain
jarvis_brain = atom_brain
