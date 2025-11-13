package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import pomo.Lockedin.dto.UserPreferencesDTO;
import pomo.Lockedin.dto.PurchaseRequestDTO;
import pomo.Lockedin.dto.PurchaseResultDTO;
import pomo.Lockedin.dto.UnlockedItemsDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.UserPreferencesService;
import pomo.Lockedin.service.UserService;

import java.util.List;

@RestController
@RequestMapping("/api/home/preferences")
@RequiredArgsConstructor
public class UserPreferencesController {

    private final UserPreferencesService userPreferencesService;
    private final UserService userService;

    /**
     * Get current user preferences (themes, PFPs, UI settings)
     */
    @GetMapping
    @ResponseStatus(HttpStatus.OK)
    public UserPreferencesDTO getUserPreferences() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return userPreferencesService.getUserPreferences(userId);
    }

    /**
     * Update user preferences
     */
    @PutMapping
    @ResponseStatus(HttpStatus.OK)
    public UserPreferencesDTO updateUserPreferences(@RequestBody UserPreferencesDTO preferencesDTO) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return userPreferencesService.updateUserPreferences(userId, preferencesDTO);
    }

    /**
     * Get all unlocked PFPs for the user
     */
    @GetMapping("/pfps/unlocked")
    @ResponseStatus(HttpStatus.OK)
    public List<String> getUnlockedPfps() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return userPreferencesService.getUnlockedPfps(userId);
    }

    /**
     * Get all unlocked themes for the user
     */
    @GetMapping("/themes/unlocked")
    @ResponseStatus(HttpStatus.OK)
    public List<String> getUnlockedThemes() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return userPreferencesService.getUnlockedThemes(userId);
    }

    /**
     * Get detailed unlocked items with metadata
     */
    @GetMapping("/unlocked")
    @ResponseStatus(HttpStatus.OK)
    public UnlockedItemsDTO getUnlockedItems() {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return userPreferencesService.getUnlockedItems(userId);
    }

    /**
     * Purchase a PFP with gold
     */
    @PostMapping("/pfps/purchase")
    @ResponseStatus(HttpStatus.OK)
    public PurchaseResultDTO purchasePfp(@RequestBody PurchaseRequestDTO purchaseRequest) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        try {
            return userPreferencesService.purchasePfp(userId, purchaseRequest);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Purchase a theme with gold
     */
    @PostMapping("/themes/purchase")
    @ResponseStatus(HttpStatus.OK)
    public PurchaseResultDTO purchaseTheme(@RequestBody PurchaseRequestDTO purchaseRequest) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        try {
            return userPreferencesService.purchaseTheme(userId, purchaseRequest);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Check if user can afford an item
     */
    @GetMapping("/can-afford/{goldCost}")
    @ResponseStatus(HttpStatus.OK)
    public boolean canAfford(@PathVariable Integer goldCost) {
        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userEmail = user.getEmail();

        Long userId = userService.getUserIdByEmail(userEmail);
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        return userPreferencesService.canUserAfford(userId, goldCost);
    }
}
