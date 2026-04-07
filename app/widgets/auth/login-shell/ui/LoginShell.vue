<script setup lang="ts">
import LoginHeroPanel from "~/widgets/auth/login-hero/ui/LoginHeroPanel.vue";
import SignInForm from "~/features/auth/sign-in/ui/SignInForm.vue";
</script>

<template>
	<main class="auth-shell">
		<div
			class="auth-shell__backdrop"
			aria-hidden="true"
		/>

		<UContainer class="relative z-10">
			<div class="auth-shell__grid">
				<LoginHeroPanel class="order-last lg:order-first" />
				<SignInForm class="order-first lg:order-last" />
			</div>
		</UContainer>
	</main>
</template>
