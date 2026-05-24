package pomo.Lockedin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import pomo.Lockedin.dto.TimeBlockDTO;
import pomo.Lockedin.entities.User;
import pomo.Lockedin.service.PremiumService;
import pomo.Lockedin.service.TimeBlockService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
public class ScheduleController {

    private final TimeBlockService timeBlockService;
    private final PremiumService premiumService;

    private String currentEmail() {
        return ((User) SecurityContextHolder.getContext().getAuthentication().getPrincipal()).getEmail();
    }

    private boolean requiresPremium() {
        return !premiumService.isPremium(currentEmail());
    }

    @GetMapping("/{date}")
    public ResponseEntity<List<TimeBlockDTO>> getBlocks(@PathVariable String date) {
        if (requiresPremium()) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        LocalDate localDate = LocalDate.parse(date);
        return ResponseEntity.ok(timeBlockService.getBlocksForDate(currentEmail(), localDate));
    }

    @PostMapping("/block")
    public ResponseEntity<TimeBlockDTO> createBlock(@RequestBody TimeBlockDTO block) {
        if (requiresPremium()) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return ResponseEntity.status(HttpStatus.CREATED).body(timeBlockService.createBlock(currentEmail(), block));
    }

    @PutMapping("/block/{id}")
    public ResponseEntity<TimeBlockDTO> updateBlock(@PathVariable Long id, @RequestBody TimeBlockDTO block) {
        if (requiresPremium()) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        return timeBlockService.updateBlock(currentEmail(), id, block)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/block/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> deleteBlock(@PathVariable Long id) {
        if (requiresPremium()) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        timeBlockService.deleteBlock(currentEmail(), id);
        return ResponseEntity.noContent().build();
    }
}
